import React, { useState } from "react";
import { Point } from "./Point";

export class GNode {
  private position: Point;
  private netForce: Point;
  private velocity: Point;
  private readonly id: number;
  private static i = 0;

  constructor(position: Point) {
    this.position = position;
    this.netForce = Point.Zero();
    this.velocity = Point.Zero();
    this.id = GNode.i++;
  }

  public clone() {
    return new GNode(this.position);
  }

  public calculateForce(
    nodes: [GNode, boolean][],
    repulsionStrength: number,
    attractionStrength: number,
    gravityStrength: number
  ) {
    const repulsion = nodes.reduce((repulsion, [other, _]) => {
      const displacement: Point = other.position.sub(this.position);
      if (displacement.isZero()) return repulsion;

      const direction: Point = displacement.normalise();

      return repulsion.sub(
        direction.scale(-repulsionStrength / displacement.mag() ** 2)
      );
    }, Point.Zero());

    const attraction = nodes.reduce((attraction, [other, isNeighbour]) => {
      if (!isNeighbour) return attraction;

      const displacement: Point = other.position.sub(this.position);
      if (displacement.isZero()) return attraction;

      return attraction.add(displacement.scale(attractionStrength));
    }, Point.Zero());

    const gravity = this.position.inv().normalise().scale(gravityStrength);

    this.netForce = repulsion.add(attraction).add(gravity);
  }

  public applyForce(dt: number) {
    this.velocity = this.velocity.add(this.netForce.scale(dt));
    this.position = this.position.add(this.velocity.scale(dt));
  }

  public getPosition() {
    return this.position;
  }

  public setPosition(position: Point) {
    this.position = position;

    return this;
  }

  public getId() {
    return this.id;
  }

  public isInEquilibrium() {
    return this.netForce.isZero();
  }
}

export interface NodeProps {
  node: GNode;
  r: number;
  selected: boolean;
  selectSelf: (shift: boolean) => void;
}

export const Node = ({ node, r, selected, selectSelf }: NodeProps) => {
  const cx = node.getPosition().getX();
  const cy = node.getPosition().getY();

  return (
    <g
      cx={cx}
      cy={cy}
      tabIndex={0}
      onClick={e => {
        selectSelf(e.shiftKey)
      }}
      className={`graph__node${selected ? " graph__node--selected" : ""}`}
    >
      <circle cx={cx} cy={cy} r={r} className="graph__node__circle"></circle>
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        fill="white"
        fontSize="1px"
        fontFamily="Arial"
        fontWeight={800}
        dy={0}
      >
        {node.getId()}
      </text>
    </g>
  );
};
