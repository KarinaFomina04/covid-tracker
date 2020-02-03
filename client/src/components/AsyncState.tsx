interface AsyncStateProps {
  message?: string;
  error?: string | null;
  retry?: () => void;
}

export default function AsyncState({ message = 'Loading statistics…', error, retry }: AsyncStateProps): JSX.Element {
  if (error) {
    return (
      <div className="notice notice--error" role="alert">
        <span>{error}</span>
        {retry && <button className="text-button" onClick={retry} type="button">Try again</button>}
      </div>
    );
  }

  return <div className="notice" role="status">{message}</div>;
}
