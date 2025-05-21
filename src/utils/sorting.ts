export const labelToSortableNumber = (label: string) => {
    const match = label.match(/^\d+(\.\d+)*/);
    if (!match) return Number.MAX_VALUE;
    return match[0].split(".").reduce((acc, val, i) => acc + parseInt(val) / Math.pow(10, i * 2), 0);
  };
  
  export {};