import './style.less';
import CircleButton from 'components/Circle/CircleButton';

const HowToCircle = ({ image, description, buttonText, back, next }) => {
  return (
    <div className="how-to-circle">
      <h1>How It Works</h1>
      {image}
      {/* <img src={} alt="how to" /> */}
      <h3>{description}</h3>
      <div className="button-group">
        <button type="button" onClick={back}>
          Back
        </button>
        <CircleButton onclick={next} text={buttonText} />
      </div>
    </div>
  );
};

export default HowToCircle;
