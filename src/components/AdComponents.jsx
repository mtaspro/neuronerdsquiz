import { useEffect } from 'react';

// Native Banner Ad Component
export const NativeBannerAd = () => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('Ad error:', e);
    }
  }, []);

  return (
    <div className="my-4">
      <script async="async" data-cfasync="false" src="https://pl28563623.effectivegatecpm.com/6dda8a9bc7243e49e44794daaccd490c/invoke.js"></script>
      <div id="container-6dda8a9bc7243e49e44794daaccd490c"></div>
    </div>
  );
};

// Desktop Banner Ad (728x90)
export const DesktopBannerAd = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.innerHTML = `
      atOptions = {
        'key' : 'f9bbbe26aa880bfe628b52b03a0e1554',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    `;
    document.body.appendChild(script);

    const invokeScript = document.createElement('script');
    invokeScript.src = 'https://www.highperformanceformat.com/f9bbbe26aa880bfe628b52b03a0e1554/invoke.js';
    document.body.appendChild(invokeScript);

    return () => {
      document.body.removeChild(script);
      document.body.removeChild(invokeScript);
    };
  }, []);

  return (
    <div className="hidden md:flex justify-center my-4">
      <div id="banner-728x90"></div>
    </div>
  );
};

// Mobile Banner Ad (320x50)
export const MobileBannerAd = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.innerHTML = `
      atOptions = {
        'key' : 'e4148fd0d8ed126086c320d7553988a6',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    `;
    document.body.appendChild(script);

    const invokeScript = document.createElement('script');
    invokeScript.src = 'https://www.highperformanceformat.com/e4148fd0d8ed126086c320d7553988a6/invoke.js';
    document.body.appendChild(invokeScript);

    return () => {
      document.body.removeChild(script);
      document.body.removeChild(invokeScript);
    };
  }, []);

  return (
    <div className="flex md:hidden justify-center my-4">
      <div id="banner-320x50"></div>
    </div>
  );
};
