import ErrorAnimation from '../components/ErrorAnimation';

const ServiceUnavailable = () => {
  return (
    <ErrorAnimation
      errorType="503"
      showBackButton={true}
    />
  );
};

export default ServiceUnavailable;