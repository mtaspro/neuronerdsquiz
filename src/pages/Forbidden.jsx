import ErrorAnimation from '../components/ErrorAnimation';

const Forbidden = () => {
  return (
    <ErrorAnimation
      errorType="403"
      showBackButton={true}
    />
  );
};

export default Forbidden;