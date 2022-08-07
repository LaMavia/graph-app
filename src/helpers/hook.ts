import { useState } from "react";

export const useForceUpdate = () => {
  const [b, setB] = useState(false);

  return () => setB(!b);
};

export const useLayers = <T>(n: number) => {
  const [layers, setLayers] = useState<(T | undefined)[][]>([[undefined]]);
  const [depth, setDepth] = useState(0);
  const [history, setHistory] = useState([layers]);

  const push = (layer: number, ...items: [T, number][]) => {
    let newLayers = [...layers];
    if (layer > depth) {
      newLayers.push(new Array(n ** (depth + 1)).fill(false));
      setDepth(depth + 1);
    }

    items.forEach(([item, i]) => {
      newLayers[layer][i] = item;
    });

    console.log({ layer, depth: depth + 1, newLayers });
    setLayers(newLayers);
    setHistory([...history, newLayers])
  };

  const revert = () => {
    if (history.length === 1) return;
    const newHistory = history.slice(0, history.length - 1);

    setLayers(newHistory[newHistory.length - 1]);
    setHistory(newHistory);

    console.log(newHistory)
  };

  return [layers, push, revert] as [typeof layers, typeof push, typeof revert];
};
