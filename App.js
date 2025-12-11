import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import './App.css';

// Default code for each language
const defaultCode = {
  python: `def calculate_sum(n):
    # This loop calculates the sum of numbers from 1 to n
    total = 0
    for i in range(n + 1):
        total += i
    return total

print(calculate_sum(10))`,
  java: `public class Main {
    // Finds the largest element in an array
    public static int findMax(int[] arr) {
        int max = arr[0]; // Assume first element is max
        for (int i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
                max = arr[i]; // Update max if current element is greater
            }
        }
        return max;
    }
    public static void main(String[] args) {
        int[] numbers = {10, 50, 30, 20, 40};
        System.out.println("Max is: " + findMax(numbers));
    }
}`,
  c: `#include <stdio.h>

int main() {
    printf("Hello, Smart Compile!\\n");
    return 0;
}`,
  cpp: `#include <iostream>

int main() {
    std::cout << "Hello, Smart Compile!" << std.endl;
    return 0;
}`,
};

function App() {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(defaultCode.python);
  const [output, setOutput] = useState('');
  const [rawError, setRawError] = useState(''); 

  const handleEditorChange = (value, event) => {
    setCode(value);
  };

  const handleLanguageChange = (event) => {
    const newLang = event.target.value;
    setLanguage(newLang);
    setCode(defaultCode[newLang]);
    setOutput('');
    setRawError('');
  };

  const handleRunCode = async () => {
    setOutput('Running code...');
    setRawError('');
    try {
      const response = await fetch('http://127.0.0.1:5000/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code, language: language }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      setOutput(data.output);
      setRawError(data.raw_error); 

    } catch (error) {
      setOutput(`Error connecting to backend: ${error.message}. Is Flask running?`);
    }
  };

  const handleExplainError = async () => {
    if (!rawError) {
      setOutput("Please run your code first and generate an error before explaining.");
      return;
    }
    setOutput("Generating AI explanation...");
    
    try {
        const response = await fetch('http://127.0.0.1:5000/explain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                code: code, 
                language: language, 
                raw_error: rawError 
            }),
        });
        const data = await response.json();
        setOutput(data.explanation); 

    } catch (error) {
        setOutput(`Error: Could not get AI explanation. Detail: ${error.message}`);
    }
  };
  
  const handleAICodeReview = async (reviewType) => {
    const reviewName = reviewType === 'static_check' ? 'AI Code Review' : 'Complexity Analysis';
    setOutput(`Running ${reviewName} for ${language}...`);
    setRawError('');

    try {
      const response = await fetch('http://127.0.0.1:5000/code_review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code, language: language, review_type: reviewType }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setOutput(`--- ${reviewName} Results ---\n${data.output}`);

    } catch (error) {
      setOutput(`Error connecting to backend for ${reviewName}: ${error.message}`);
    }
  };


  const handleAutoComment = async () => {
    setOutput('Generating inline comments...');
    setRawError('');
    
    try {
      const response = await fetch('http://127.0.0.1:5000/auto_comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code, language: language }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update the editor with the new commented code
      setCode(data.output);
      setOutput('Comments generated successfully! Check the code editor.');

    } catch (error) {
      setOutput(`Error generating comments: ${error.message}`);
    }
  };


  // Placeholder function for future features
  const handlePlaceholderClick = (featureName) => {
      setOutput(`Feature ${featureName} is not yet implemented. This is the only remaining feature!`);
  }


  return (
    <div className="App">
      <header className="App-header">
        <h1>Smart Compile</h1>
      </header>
      <div className="language-selector-container">
        <label htmlFor="language-select">Select Language: </label>
        <select id="language-select" value={language} onChange={handleLanguageChange}>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
        </select>
      </div>
      <div className="code-and-output-container">
        <div className="editor-container">
          <Editor
            height="70vh"
            width="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
          />
        </div>
        <div className="output-panel">
          <h2>Output:</h2>
          <pre>{output}</pre>
        </div>
      </div>
      <div className="button-container">
        <button className="action-button" onClick={handleRunCode}>Run Code</button>
        <button className="action-button" onClick={() => handleAICodeReview('static_check')}>AI Code Review</button>
        <button className="action-button" onClick={handleExplainError}>Explain Error</button>
        <button className="action-button" onClick={handleAutoComment}>Auto-Comment</button>
        <button className="action-button" onClick={() => handleAICodeReview('complexity')}>Complexity Analysis</button>
        {/* The "Format Code" button now calls the general placeholder */}
        <button className="action-button" onClick={() => handlePlaceholderClick("Format Code")}>Format Code</button>
      </div>
    </div>
  );
}

export default App;