import ErrorAnimation from '../components/ErrorAnimation';

const NotFound = () => {
  return (
    <ErrorAnimation
      errorType="404"
      showBackButton={true}
    />
  );
};

export default NotFound;