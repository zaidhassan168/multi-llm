// app/page.tsx
'use client'
import React, { useState } from 'react';

const  CodeChat = () => {
  const [code, setCode] = useState('');
  const [comment, setComment] = useState('');

  const handleGenerateComment = async () => {
    const response = await fetch('/api/generate-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();
    setComment(data.comment);
  };

  return (
    <div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste your code here"
      />
      <button onClick={handleGenerateComment}>Generate Comment</button>
      <p>{comment}</p>
    </div>
  );
};

export default CodeChat;
