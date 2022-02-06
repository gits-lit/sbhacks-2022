import { useEffect, useState } from 'react';

// import Question from '../Question';
import scribble from 'assets/scribble3.svg';
// import circle from 'assets/circle2.svg';
import Answer from '../Answer';
import './style.less';

const Questions = ({
  questionState: { number, question, answerA, answerB, answerC, answerD, answerCount = 0, correct, playerCount = 0 },
}) => {
  const [time, setTime] = useState(10);
  const [timer, setTimer] = useState();

  useEffect(() => {
    const intID = setInterval(() => {
      setTime((prevTime) => prevTime - 1);
    }, 1000);

    setTimer(intID);
  }, [question]);

  useEffect(() => {
    if (time === 0 && timer) {
      window.clearInterval(timer);
    }
  }, [time, timer]);

  return (
    <div className="question-container">
      <div className="question-div">
        <h1>Question {number}</h1>
        <h3>{question}</h3>
      </div>
      <div className="time-answer-div">
        <span className="timer">{time} sec</span>
        <div className="ans-count">
          <span className="num-answers">
            {answerCount}/{playerCount} answers
          </span>
          <img src={scribble} alt="" />
        </div>
      </div>
      <div className="question-options">
        <Answer letter="A" answer={answerA} toggle={correct === 'A'} />
        <Answer letter="B" answer={answerB} toggle={correct === 'B'} />
        <Answer letter="C" answer={answerC} toggle={correct === 'C'} />
        <Answer letter="D" answer={answerD} toggle={correct === 'D'} />
      </div>
    </div>
  );
};

export default Questions;
