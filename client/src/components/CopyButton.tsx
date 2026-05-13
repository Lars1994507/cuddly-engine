import { useState } from 'react';

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button className="copy-btn" onClick={handleCopy} title={`Copy ${text}`}>
      {copied ? '✓' : '⎘'}
    </button>
  );
}
