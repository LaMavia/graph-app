import React, { useEffect } from "react";
import { useLayers } from "../../helpers/hook";
import { GGraph, Graph } from "../Graph/Graph";
import { GNode } from "../Graph/Node";
import { Point } from "../Graph/Point";
import "./styles.css";

function App() {
  const [layers, pushGraph, revert] = useLayers<GGraph>(2);

  // make the initial graph
  useEffect(() => {
    const g = GGraph.Empty();
    const d = 5;
    const n = 3;

    new Array(n)
      .fill(0)
      .flatMap((_, i) => new Array(n).fill(0).map((_, j) => [i * d, d * j]))
      .forEach(([p, q]) => g.addNode(new GNode(new Point(p, q))));

    [
      [0, 1],
      [0, n],
      [0, n + 1],
      [n + 1, 2],
      [n + 1, 2 * n + 1],
    ].forEach(([p, q]) => g.addEdge(new Point(p, q)));

    pushGraph(0, [g, 0]);
  }, []);

  useEffect(() => {
    window.addEventListener("keyup", (e) => {
      console.log("hello")
      switch (e.key) {
        case "z":
          revert();
          break;
      }
    });
  }, []);

  const onEdge = (graph: GGraph, edge: Point, layer: number, i: number) => {
    const contracted = graph.clone();
    const deleted = graph.clone();

    contracted.contractEdge(edge);
    deleted.removeEdge(edge);

    pushGraph(layer + 1, [deleted, 2 * i], [contracted, 2 * i + 1]);
  };

  return (
    <div className="app">
      <section className="instructions">
        <ul className="instructions__list">
          {[
            "a - add a node",
            "Shift + a - select all nodes",
            "x - remove selected nodes",
            "m - move nodes",
            "z - undo iteration",
          ].map((instr) => (
            <li className="instructions__list__item">{instr}</li>
          ))}
        </ul>
      </section>
      {layers.map((layer, layerIndex) => (
        <div
          className="layer"
          key={layerIndex}
          style={
            {
              "--n-layers": layers.length,
              "--n-graphs": layer.length,
              "--max-graphs": 2 ** (layers.length - 1),
              "--layer": layerIndex
            } as React.CSSProperties
          }
        >
          {layer.map((graph, i) =>
            graph ? (
              <Graph
                onEdge={(edge) => onEdge(graph, edge, layerIndex, i)}
                graph={graph}
                key={`${layerIndex}:${i}`}
              ></Graph>
            ) : (
              <div className="layer__filler"></div>
            )
          )}
        </div>
      ))}
    </div>
  );
}

export default App;
