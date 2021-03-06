import React from 'react';
import arrow from 'assets/arrow.svg';
import circle from 'assets/create-circle.svg';

import './style.less';

const CircleButton = ({ text, onclick }) => {
  return (
    <div onClick={onclick} className="button">
      <span>{text}</span>
      <img src={arrow} alt="arrow" />
      <img className="create-circle" src={circle} alt="circle" />
    </div>
  );
};

export default CircleButton;
