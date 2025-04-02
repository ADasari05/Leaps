  export const isAuthenticated = () => {
    console.log(localStorage.getItem('token'));
    console.log(!!localStorage.getItem('token'));
    return !!localStorage.getItem('token');
  };
  
  export const isGuest = () => {
    return localStorage.getItem('guestMode') === 'true';
  };
  
  export const startGuestSession = () => {
    localStorage.setItem('guestMode', 'true');
  };
  
  export const endGuestSession = () => {
    localStorage.removeItem('guestMode');
  };

  export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('guestMode');
  };