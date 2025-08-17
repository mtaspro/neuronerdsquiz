import ErrorAnimation from '../components/ErrorAnimation';

const ServerError = () => {
  return (
    <ErrorAnimation
      errorType="500"
      showBackButton={true}
    />
  );
};

export default ServerError;