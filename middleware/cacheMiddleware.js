import NodeCache from 'node-cache';

// Create cache instances with different TTL
const shortCache = new NodeCache({ stdTTL: 300 }); // 5 minutes
const mediumCache = new NodeCache({ stdTTL: 1800 }); // 30 minutes
const longCache = new NodeCache({ stdTTL: 3600 }); // 1 hour

export const cacheMiddleware = (duration = 'short') => {
  const cache = duration === 'long' ? longCache : duration === 'medium' ? mediumCache : shortCache;
  
  return (req, res, next) => {
    const key = req.originalUrl || req.url;
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      return res.json(cachedResponse);
    }
    
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache response
    res.json = function(data) {
      cache.set(key, data);
      return originalJson.call(this, data);
    };
    
    next();
  };
};

export const clearCache = (pattern) => {
  [shortCache, mediumCache, longCache].forEach(cache => {
    const keys = cache.keys();
    keys.forEach(key => {
      if (key.includes(pattern)) {
        cache.del(key);
      }
    });
  });
};