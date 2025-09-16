import React, { memo } from 'react';
import { useVirtualization } from '../hooks/useVirtualization';

const LazyTable = memo(({ 
  data, 
  columns, 
  itemHeight = 60, 
  containerHeight = 400,
  className = "",
  onRowClick 
}) => {
  const { 
    items: visibleItems, 
    totalHeight, 
    offsetY, 
    onScroll 
  } = useVirtualization(data, itemHeight, containerHeight);

  return (
    <div className={`overflow-hidden ${className}`}>
      <div 
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={onScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleItems.map((item, index) => (
              <div
                key={item._id || index}
                className="flex border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                style={{ height: itemHeight }}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column, colIndex) => (
                  <div
                    key={colIndex}
                    className={`flex items-center px-4 ${column.className || ''}`}
                    style={{ width: column.width || 'auto', flex: column.flex || 'none' }}
                  >
                    {column.render ? column.render(item) : item[column.key]}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

LazyTable.displayName = 'LazyTable';

export default LazyTable;