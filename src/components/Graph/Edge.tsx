import React from "react";
import { GNode } from "./Node";

export interface EdgeProps {
  p: GNode;
  q: GNode;
  onClick: (p: GNode, q: GNode) => void;
}

export const Edge = ({ p, q, onClick }: EdgeProps) => {
  return (
    <line
      x1={p.getPosition().getX()}
      y1={p.getPosition().getY()}
      x2={q.getPosition().getX()}
      y2={q.getPosition().getY()}
      className="graph__edge"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        onClick(p, q);
      }}
    ></line>
  );
};
