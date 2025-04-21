import React, { useState } from 'react';
import "../styles/SplitCost.css"

export default function SplitCost({ total, perUser, youOwe }) {
    return (
      <div className="split-cost-card">
        <h3>Cost Summary</h3>
        <div className="cost-row">
          <span>Total Trip Cost:</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="cost-row">
          <span>Even Split:</span>
          <span>${perUser.toFixed(2)}/person</span>
        </div>
        <div className="cost-row you-owe">
          <span>Your Estimate:</span>
          <span>${youOwe.toFixed(2)}</span>
        </div>
      </div>
    );
  }