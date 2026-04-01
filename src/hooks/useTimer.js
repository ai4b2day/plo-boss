import { useState, useRef, useCallback, useEffect } from 'react';

export default function useTimer(initialSeconds = 15, onExpire = null) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback((seconds) => {
    stop();
    const duration = seconds ?? initialSeconds;
    setTimeLeft(duration);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsRunning(false);
          if (onExpireRef.current) onExpireRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [initialSeconds, stop]);

  const reset = useCallback((seconds) => {
    stop();
    setTimeLeft(seconds ?? initialSeconds);
  }, [initialSeconds, stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Color based on time remaining
  let color = 'text-success';
  let bgColor = 'bg-success';
  if (timeLeft <= 5) {
    color = 'text-danger';
    bgColor = 'bg-danger';
  } else if (timeLeft <= 10) {
    color = 'text-warning';
    bgColor = 'bg-warning';
  }

  const pulsing = timeLeft <= 5 && isRunning;

  return { timeLeft, isRunning, start, stop, reset, color, bgColor, pulsing };
}
