import ErrorAnimation from '../components/ErrorAnimation';

const Unauthorized = () => {
  return (
    <ErrorAnimation
      errorType="401"
      showBackButton={true}
    />
  );
};

export default Unauthorized;