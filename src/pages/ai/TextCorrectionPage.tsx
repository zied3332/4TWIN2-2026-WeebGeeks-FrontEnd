import { useMemo, useState } from 'react';
import './TextCorrectionPage.css';

type DiffToken = {
  original: string;
  corrected: string;
  changed: boolean;
};

export default function TextCorrectionPage() {
  const [inputText, setInputText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCorrectText = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text.');
      setCorrectedText('');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setCorrectedText('');

      const response = await fetch('http://localhost:3000/ai/correct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error('Failed to correct text.');
      }

      const data = await response.json();
      setCorrectedText(data.corrected || '');
    } catch (err) {
      setError('Something went wrong while correcting the text.');
    } finally {
      setLoading(false);
    }
  };

  const diffTokens = useMemo(() => {
    return buildSimpleDiff(inputText, correctedText);
  }, [inputText, correctedText]);

  const changedPairs = useMemo(() => {
    return diffTokens.filter(
      (token) =>
        token.changed &&
        token.original.trim() &&
        token.corrected.trim() &&
        token.original !== token.corrected
    );
  }, [diffTokens]);

  return (
    <div className="text-correction-page">
      <div className="text-correction-card">
        <span className="eyebrow">AI Copilot</span>
        <h1>Text Correction</h1>
        <p>
          Write any text with spelling, grammar, or punctuation mistakes, and let
          the assistant return a cleaner corrected version.
        </p>

        <div className="form-group">
          <label htmlFor="inputText">Original Text</label>
          <textarea
            id="inputText"
            rows={8}
            placeholder="Type your text here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>

        <button
          className="correct-btn"
          onClick={handleCorrectText}
          disabled={loading}
        >
          {loading ? 'Correcting...' : 'Correct Text'}
        </button>

        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="correctedText">Corrected Text</label>
          <textarea
            id="correctedText"
            rows={8}
            value={correctedText}
            readOnly
            placeholder="The corrected text will appear here..."
          />
        </div>

        {(inputText || correctedText) && (
          <div className="highlight-section">
            <div className="preview-grid">
              <div className="preview-card">
                <h3>Original Preview</h3>
                <div className="highlight-preview">
                  {diffTokens.length > 0 ? (
                    diffTokens.map((token, index) => (
                      <span
                        key={`original-${index}`}
                        className={token.changed ? 'word-chip wrong-word' : 'word-chip'}
                      >
                        {token.original || ' '}
                      </span>
                    ))
                  ) : (
                    <span className="placeholder-text">
                      Your original text will appear here...
                    </span>
                  )}
                </div>
              </div>

              <div className="preview-card">
                <h3>Corrected Preview</h3>
                <div className="highlight-preview">
                  {diffTokens.length > 0 ? (
                    diffTokens.map((token, index) => (
                      <span
                        key={`corrected-${index}`}
                        className={token.changed ? 'word-chip fixed-word' : 'word-chip'}
                      >
                        {token.corrected || token.original || ' '}
                      </span>
                    ))
                  ) : (
                    <span className="placeholder-text">
                      Corrected text will appear here...
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="changes-card">
              <h3>Detected Fixes</h3>

              {changedPairs.length > 0 ? (
                <div className="changes-list">
                  {changedPairs.map((item, index) => (
                    <div key={`change-${index}`} className="change-item">
                      <span className="change-old">{item.original}</span>
                      <span className="change-arrow">→</span>
                      <span className="change-new">{item.corrected}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="placeholder-text">
                  No highlighted fixes yet. Enter text and run correction.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function buildSimpleDiff(originalText: string, correctedText: string): DiffToken[] {
  const originalWords = splitWords(originalText);
  const correctedWords = splitWords(correctedText);

  const maxLength = Math.max(originalWords.length, correctedWords.length);
  const result: DiffToken[] = [];

  for (let i = 0; i < maxLength; i++) {
    const original = originalWords[i] ?? '';
    const corrected = correctedWords[i] ?? '';
    const changed = normalizeWord(original) !== normalizeWord(corrected);

    result.push({
      original,
      corrected,
      changed,
    });
  }

  return result;
}

function splitWords(text: string): string[] {
  if (!text.trim()) return [];
  return text.split(/\s+/);
}

function normalizeWord(word: string): string {
  return word.replace(/[^\w']/g, '').toLowerCase().trim();
}