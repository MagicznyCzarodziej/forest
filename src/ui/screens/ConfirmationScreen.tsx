import { useState } from 'react';
import { useInput } from 'ink';
import { ConfirmPrompt } from '../components/ConfirmPrompt';

interface ConfirmationScreenProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onDecline: () => void;
  onCancel: () => void;
}

export function ConfirmationScreen({
  title,
  message,
  onConfirm,
  onDecline,
  onCancel,
}: ConfirmationScreenProps) {
  const [selected, setSelected] = useState<'yes' | 'no'>('yes');

  useInput((input, key) => {
    if (key.leftArrow || key.rightArrow || key.tab) {
      setSelected((choice) => (choice === 'yes' ? 'no' : 'yes'));
    }
    if (input.toLowerCase() === 'y') {
      setSelected('yes');
    }
    if (input.toLowerCase() === 'n') {
      setSelected('no');
    }
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.return) {
      if (selected === 'yes') {
        onConfirm();
      } else {
        onDecline();
      }
    }
  });

  return <ConfirmPrompt title={title} message={message} selected={selected} />;
}
