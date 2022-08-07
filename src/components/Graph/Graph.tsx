import React, { useEffect, useMemo, useReducer, useState } from "react";
import { nodeModuleNameResolver } from "typescript";
import { useForceUpdate } from "../../helpers/hook";
import { zipWith } from "../../helpers/list";
import { Edge } from "./Edge";
import { GNode, Node } from "./Node";
import { Point } from "./Point";
import "./styles.css";

export class GGraph {
  private nodes: GNode[];
  private edges: boolean[][];

  constructor(nodes: GNode[], edges: boolean[][]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  public logAdj() {
    console.table(this.edges.map((r) => r.map(Number)));
  }

  public static Empty() {
    return new GGraph([], []);
  }

  public size() {
    return this.nodes.length;
  }

  public clone() {
    return new GGraph(
      this.nodes.map((n) => n.clone()),
      this.edges.map((row) => [...row])
    );
  }

  private setEdge(e: Point, v: boolean) {
    if (!e || e.getX() >= this.size() || e.getY() >= this.size()) {
      throw new Error(
        `Invalid edge in setEdge: {${e.getX()}, ${e.getY()}}, size=${this.size()}`
      );
    }

    const a = Math.floor(e.getX());
    const b = Math.floor(e.getY());

    this.edges[a][b] = v;
    this.edges[b][a] = v;

    return this;
  }

  public addEdge(e: Point) {
    return this.setEdge(e, true);
  }

  public removeEdge(e: Point) {
    return this.setEdge(e, false);
  }

  public contractEdge(e: Point) {
    if (!e || e.getX() >= this.size() || e.getY() >= this.size()) {
      throw new Error(
        `Invalid edge in contractEdge: {${e.getX()}, ${e.getY()}}, size=${this.size()}`
      );
    }

    const u = this.nodes[e.getX()];
    const v = this.nodes[e.getY()];

    // remove the edge
    this.removeEdge(e);

    // add new edges
    this.edges[e.getY()]
      .map((v, i) => [v, i] as [boolean, number])
      .filter(([areNeighbours, _]) => areNeighbours)
      .map(([_, i]) => new Point(e.getX(), i))
      .forEach((newEdge) => this.addEdge(newEdge));

    // move to the mid point
    u.setPosition(
      u
        .getPosition()
        .add(v.getPosition())
        .scale(1 / 2)
    );

    // remove one node
    this.removeNode(v);

    return this;
  }

  public addNode(node: GNode) {
    this.nodes.push(node);

    this.edges = [
      ...this.edges.map((row) => [...row, false]),
      new Array(this.nodes.length).fill(false),
    ];

    return this;
  }

  public removeNode(node: GNode) {
    const i = this.nodes.findIndex((n) => n.getId() === node.getId());

    if (i < 0) return this;

    this.nodes = this.nodes.filter((_, j) => j !== i);
    this.edges = this.edges
      .filter((_, j) => j !== i)
      .map((row) => row.filter((_, j) => j !== i));

    return this;
  }

  public getNodes() {
    return [...this.nodes];
  }

  public getEdges(): [GNode, GNode][] {
    return this.edges.flatMap((row, i) =>
      row
        .map(
          (v, j) => [this.nodes[i], this.nodes[j], v] as [GNode, GNode, boolean]
        )
        .filter(([, , v]) => v)
        .map(([p, q, _]) => [p, q] as [GNode, GNode])
    );
  }

  public areNeighbours(i: number, j: number) {
    return this.edges[i][j];
  }

  public indexOfNode(node: GNode): number {
    const i = this.nodes.findIndex((other) => other.getId() === node.getId());

    if (i < 0) {
      throw new Error(
        `Couldn't find a node with id ${node.getId()} in Graph.indexOfNode`
      );
    }

    return i;
  }
}

export interface GraphProps {
  graph: GGraph;
  onEdge: (edge: Point) => void;
}

enum ATSelectedNodesAction {
  Switch = "ATSelectedNodesActionSwitch",
  Clear = "ATSelectedNodesActionClear",
  Set = "ATSelectedNodesActionSet",
}

interface SelectedNodesActionSwitch {
  type: ATSelectedNodesAction.Switch;
  clearRest: boolean;
  node: GNode;
}

interface SelectedNodesActionClear {
  type: ATSelectedNodesAction.Clear;
}

interface SelectedNodesActionSet {
  type: ATSelectedNodesAction.Set;
  nodes: GNode[];
}

export type SelectedNodesAction =
  | SelectedNodesActionSwitch
  | SelectedNodesActionClear
  | SelectedNodesActionSet;

export const Graph = ({ graph, onEdge }: GraphProps) => {
  const [time, setTime] = useState(Date.now());
  const [mousePosition, setMousePosition] = useState(new Point(0, 0));
  const [isFollowing, setFollowing] = useState(false);
  const [selectedNodes, dispatchSelectedNodes] = useReducer(
    (state: GNode[], action: SelectedNodesAction) => {
      switch (action.type) {
        case ATSelectedNodesAction.Switch: {
          let wasRemoved = false;

          const filteredSelected = state.filter((other) => {
            const matchingId = other.getId() !== action.node.getId();
            wasRemoved ||= !matchingId;

            if (action.clearRest) return false;
            return matchingId;
          });

          if (!wasRemoved) {
            filteredSelected.push(action.node);
          }

          if (filteredSelected.length === 0) {
            setFollowing(false);
          }

          return filteredSelected;
        }

        case ATSelectedNodesAction.Set: {
          return action.nodes;
        }

        case ATSelectedNodesAction.Clear: {
          setFollowing(false);
          return [];
        }

        default:
          return state;
      }
    },
    []
  );
  const forceUpdate = useForceUpdate();
  const dt = 1 / 120;
  const padding = 10;
  const r = 2;

  // animation update loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (graph.getNodes().every((n) => n.isInEquilibrium())) {
        clearInterval(interval);
        console.log("done!");
      } else {
        setTime(Date.now());
      }
    }, dt);

    return () => {
      clearInterval(interval);
    };
  });

  // animation calculation loop
  useEffect(() => {
    const nodes = graph.getNodes();

    nodes.forEach((node, i) => {
      node.calculateForce(
        nodes
          .filter((_, j) => j !== i)
          .map((other, j) => [other, graph.areNeighbours(i, j)]),
        0, // -0.1,//-5e-1,
        0, // 0.001,//1e-6,
        0 //1e-2
      );
      node.applyForce(dt);
    });
  }, [graph, dt, time]);

  // controls
  const onKeyUp = (e: React.KeyboardEvent<SVGGElement>) => {
    e.preventDefault();
    e.stopPropagation();

    switch (e.key) {
      case "m":
        if (selectedNodes.length > 0) {
          setFollowing(!isFollowing);
        }
        break;
      case "A":
        if (selectedNodes.length === graph.size()) {
          dispatchSelectedNodes({
            type: ATSelectedNodesAction.Clear,
          });
        } else {
          dispatchSelectedNodes({
            type: ATSelectedNodesAction.Set,
            nodes: graph.getNodes(),
          });
        }
        break;
      case "a":
        graph.addNode(new GNode(mousePosition));
        forceUpdate();
        break;
      case "x":
        selectedNodes.forEach((node) => graph.removeNode(node));
        dispatchSelectedNodes({
          type: ATSelectedNodesAction.Clear,
        });
        break;
      case "e":
        zipWith(
          (u, vs) =>
            vs.map(
              (v) => new Point(graph.indexOfNode(u), graph.indexOfNode(v))
            ),
          selectedNodes,
          new Array(Math.max(0, selectedNodes.length - 1))
            .fill(undefined)
            .map((_, i) => selectedNodes.slice(i + 1))
        )
          .flat()
          .forEach((e) => graph.addEdge(e));
        dispatchSelectedNodes({
          type: ATSelectedNodesAction.Clear,
        });
        forceUpdate();
        break;
    }
  };

  const { minX, minY, maxX, maxY } = { minX: 0, maxX: 30, minY: 0, maxY: 30 }
  /*const { minX, minY, maxX, maxY } =
    graph.size() === 0
      ? { minX: 0, maxX: 10, minY: 0, maxY: 10 }
      : graph.getNodes().reduce(
          ({ minX, minY, maxX, maxY }, node) => {
            const pos = node.getPosition();

            return {
              maxX: Math.max(maxX, pos.getX() + r),
              maxY: Math.max(maxY, pos.getY() + r),
              minX: Math.min(minX, pos.getX() - r),
              minY: Math.min(minY, pos.getY() - r),
            };
          },
          {
            minX: Number.MAX_VALUE,
            minY: Number.MAX_VALUE,
            maxX: Number.MIN_SAFE_INTEGER,
            maxY: Number.MIN_SAFE_INTEGER,
          }
        );
          */
  return (
    <svg
      height="100%"
      tabIndex={0}
      viewBox={`${minX - padding} ${minY - padding} ${
        maxX - minX + 2 * padding
      } ${maxY - minY + 2 * padding}`}
      xmlns="http://www.w3.org/2000/svg"
      className={`graph${isFollowing ? " graph--following" : ""}`}
      onKeyUp={onKeyUp}
      onMouseMove={(e) => {
        const parent = e.currentTarget as any as HTMLElement;

        if (!parent) return;

        const w = maxX - minX + 2 * padding;
        const h = maxY - minY + 2 * padding;

        const newMousePosition = new Point(
          ((e.clientX - parent.clientLeft) / parent.clientWidth) * w -
            padding +
            minX,
          ((e.clientY - parent.clientTop) / parent.clientHeight) * h -
            padding +
            minY
        );

        setMousePosition(newMousePosition);

        if (isFollowing) {
          selectedNodes.forEach((node) =>
            node.setPosition(
              node.getPosition().add(newMousePosition.sub(mousePosition))
            )
          );
        }
      }}
    >
      {graph.getEdges().map(([p, q], i) => (
        <Edge
          onClick={() => {
            onEdge(new Point(graph.indexOfNode(p), graph.indexOfNode(q)));

            forceUpdate();
          }}
          key={`${p.getId()}${q.getId()}`}
          p={p}
          q={q}
        />
      ))}
      {graph.getNodes().map((node) => (
        <Node
          selected={selectedNodes.includes(node)}
          selectSelf={(shift) =>
            dispatchSelectedNodes({
              type: ATSelectedNodesAction.Switch,
              clearRest: !shift,
              node,
            })
          }
          key={node.getId()}
          node={node}
          r={r}
        />
      ))}
    </svg>
  );
};
