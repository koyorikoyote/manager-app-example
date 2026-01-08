import React, { useState, useRef } from 'react';
import { Card, CardProps } from './Card';
import { useTouch } from '../../hooks/useTouch';
import { cn } from '../../utils/cn';

interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  color: 'primary' | 'secondary' | 'destructive' | 'success';
  onAction: () => void;
}

interface SwipeableCardProps extends CardProps {
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipe?: (direction: 'left' | 'right', actions: SwipeAction[]) => void;
  swipeThreshold?: number;
  disabled?: boolean;
}

const actionColors = {
  primary: 'bg-primary-500 text-white',
  secondary: 'bg-secondary-500 text-white',
  destructive: 'bg-red-500 text-white',
  success: 'bg-green-500 text-white',
};

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  onSwipe,
  swipeThreshold = 80,
  disabled = false,
  className,
  ...props
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isRevealed, setIsRevealed] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;

    startXRef.current = e.touches[0].clientX;
    currentXRef.current = startXRef.current;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !isDraggingRef.current) return;

    currentXRef.current = e.touches[0].clientX;
    const deltaX = currentXRef.current - startXRef.current;

    // Apply resistance when swiping beyond available actions
    let resistedDeltaX = deltaX;
    if (deltaX > 0 && leftActions.length === 0) {
      resistedDeltaX = deltaX * 0.2; // Resistance when no left actions
    } else if (deltaX < 0 && rightActions.length === 0) {
      resistedDeltaX = deltaX * 0.2; // Resistance when no right actions
    }

    setTranslateX(resistedDeltaX);
  };

  const handleTouchEnd = () => {
    if (disabled || !isDraggingRef.current) return;

    isDraggingRef.current = false;
    const deltaX = currentXRef.current - startXRef.current;
    const absDistance = Math.abs(deltaX);

    if (absDistance > swipeThreshold) {
      if (deltaX > 0 && leftActions.length > 0) {
        // Swiped right, reveal left actions
        setTranslateX(leftActions.length * 80);
        setIsRevealed('left');
        onSwipe?.('right', leftActions);
      } else if (deltaX < 0 && rightActions.length > 0) {
        // Swiped left, reveal right actions
        setTranslateX(-rightActions.length * 80);
        setIsRevealed('right');
        onSwipe?.('left', rightActions);
      } else {
        // Snap back
        setTranslateX(0);
        setIsRevealed(null);
      }
    } else {
      // Snap back
      setTranslateX(0);
      setIsRevealed(null);
    }
  };

  const handleActionClick = (action: SwipeAction) => {
    action.onAction();
    // Reset card position after action
    setTranslateX(0);
    setIsRevealed(null);
  };

  const { bindTouch: _bindTouch } = useTouch({
    onSwipe: ({ direction }) => {
      if (direction === 'left' && rightActions.length > 0) {
        setTranslateX(-rightActions.length * 80);
        setIsRevealed('right');
        onSwipe?.(direction, rightActions);
      } else if (direction === 'right' && leftActions.length > 0) {
        setTranslateX(leftActions.length * 80);
        setIsRevealed('left');
        onSwipe?.(direction, leftActions);
      }
    },
  });

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex">
          {leftActions.map((action, index) => (
            <button
              key={index}
              className={cn(
                'flex flex-col items-center justify-center w-20 h-full transition-all duration-200',
                actionColors[action.color],
                'active:scale-95 touch-manipulation'
              )}
              onClick={() => handleActionClick(action)}
            >
              <div className="mb-1">{action.icon}</div>
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex">
          {rightActions.map((action, index) => (
            <button
              key={index}
              className={cn(
                'flex flex-col items-center justify-center w-20 h-full transition-all duration-200',
                actionColors[action.color],
                'active:scale-95 touch-manipulation'
              )}
              onClick={() => handleActionClick(action)}
            >
              <div className="mb-1">{action.icon}</div>
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Card */}
      <Card
        ref={cardRef}
        className={cn(
          'transition-transform duration-200 ease-out touch-manipulation',
          className
        )}
        style={{
          transform: `translateX(${translateX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        {children}
      </Card>

      {/* Tap to close overlay when actions are revealed */}
      {isRevealed && (
        <div
          className="absolute inset-0 z-10 bg-transparent"
          onClick={() => {
            setTranslateX(0);
            setIsRevealed(null);
          }}
        />
      )}
    </div>
  );
};