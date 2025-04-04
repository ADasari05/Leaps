// src/utils/comparisonUtils.js

/**
 * Finds similar items based on location and type
 * @param {Array} allItems - All available items
 * @param {Object} selectedItem - The currently selected item
 * @param {Number} radius - Distance radius to consider (in arbitrary units)
 * @returns {Array} - Similar items sorted by price
 */
export const findSimilarItems = (allItems, selectedItem, radius = 100) => {
    if (!selectedItem) return [];
    
    // For lodging, filter by location and type
    if (selectedItem.type && selectedItem.location) {
      return allItems.filter(item => 
        item.id !== selectedItem.id && 
        item.type === selectedItem.type &&
        isSameGeneralLocation(item.location, selectedItem.location)
      );
    }
    
    // For travel, filter by departure and arrival locations
    if (selectedItem.departure_location && selectedItem.arrival_location) {
      return allItems.filter(item => 
        item.id !== selectedItem.id &&
        item.type === selectedItem.type && 
        isSameGeneralLocation(item.departure_location, selectedItem.departure_location) &&
        isSameGeneralLocation(item.arrival_location, selectedItem.arrival_location)
      );
    }
    
    return [];
  };
  
  /**
   * Check if locations are similar (simplified for demo)
   * @param {String} location1 
   * @param {String} location2 
   * @returns {Boolean} - Whether locations are similar
   */
  const isSameGeneralLocation = (location1, location2) => {
    if (!location1 || !location2) return false;
    
    // Extract city from location strings
    const city1 = location1.split(',')[0].trim().toLowerCase();
    const city2 = location2.split(',')[0].trim().toLowerCase();
    
    return city1 === city2;
  };
  
  /**
   * Determines if an item is a better deal than the current selection
   * @param {Object} item - Item to check
   * @param {Object} currentSelection - Currently selected item
   * @returns {Boolean} - Whether item is a better deal
   */
  export const isBetterDeal = (item, currentSelection) => {
    if (!currentSelection) return false;
    
    // For lodging
    if (item.price_per_night && currentSelection.price_per_night) {
      return item.price_per_night < currentSelection.price_per_night;
    }
    
    // For travel
    if (item.price && currentSelection.price) {
      return item.price < currentSelection.price;
    }
    
    return false;
  };
  
  /**
   * Sorts items by price (lowest first)
   * @param {Array} items - Items to sort
   * @param {String} type - 'lodging' or 'travel'
   * @returns {Array} - Sorted items
   */
  export const sortByPrice = (items, type = 'lodging') => {
    if (!items || !items.length) return [];
    
    return [...items].sort((a, b) => {
      if (type === 'lodging') {
        return a.price_per_night - b.price_per_night;
      } else {
        return a.price - b.price;
      }
    });
  };
  
  /**
   * Generate price comparison data for display
   * @param {Object} item - Item to compare
   * @param {Object} selectedItem - Currently selected item
   * @returns {Object} - Comparison data
   */
  export const generateComparisonData = (item, selectedItem) => {
    if (!selectedItem) return null;
    
    // For lodging
    if (item.price_per_night && selectedItem.price_per_night) {
      const priceDiff = selectedItem.price_per_night - item.price_per_night;
      const percentDiff = (priceDiff / selectedItem.price_per_night) * 100;
      
      return {
        priceDiff,
        percentDiff,
        savings: priceDiff > 0 ? `Save $${priceDiff.toFixed(2)} per night (${percentDiff.toFixed(1)}%)` : null
      };
    }
    
    // For travel
    if (item.price && selectedItem.price) {
      const priceDiff = selectedItem.price - item.price;
      const percentDiff = (priceDiff / selectedItem.price) * 100;
      
      return {
        priceDiff,
        percentDiff,
        savings: priceDiff > 0 ? `Save $${priceDiff.toFixed(2)} (${percentDiff.toFixed(1)}%)` : null
      };
    }
    
    return null;
  };