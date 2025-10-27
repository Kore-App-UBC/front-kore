import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
// Import SVG components
import Svg, { Circle, Line } from 'react-native-svg';
import { AnimationData, Transformation } from '../types';

const ThemedView = View;

interface ExerciseAnimationPreviewProps {
  animationData: AnimationData | null;
  width?: number;
  height?: number;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Point2D {
  x: number;
  y: number;
  z: number; // Keep z for depth sorting and radius scaling
}

const FOV = 400;

// --- Animation Helper Functions (Unchanged) ---
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpVector = (v1: [number, number, number], v2: [number, number, number], t: number): [number, number, number] => [
  lerp(v1[0], v2[0], t),
  lerp(v1[1], v2[1], t),
  lerp(v1[2], v2[2], t),
];
const addVectors = (p: Point3D, v: [number, number, number]): Point3D => ({
  x: p.x + v[0],
  y: p.y + v[1],
  z: p.z + v[2],
});
const applyRotation = (pivot: Point3D, angleDeg: number, axis: 'x' | 'y' | 'z', distance: number): Point3D => {
  const angleRad = angleDeg * (Math.PI / 180);
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const baseVector = { x: 0, y: distance, z: 0 };
  let rotatedVector: Point3D = { x: 0, y: 0, z: 0 };

  if (axis === 'x') {
    rotatedVector = {
      x: baseVector.x,
      y: baseVector.y * cos - baseVector.z * sin,
      z: baseVector.y * sin + baseVector.z * cos,
    };
  } else if (axis === 'y') {
    rotatedVector = {
      x: baseVector.x * cos + baseVector.z * sin,
      y: baseVector.y,
      z: -baseVector.x * sin + baseVector.z * cos,
    };
  } else if (axis === 'z') {
    rotatedVector = {
      x: baseVector.x * cos - baseVector.y * sin,
      y: baseVector.x * sin + baseVector.y * cos,
      z: baseVector.z,
    };
  }
  return addVectors(pivot, [rotatedVector.x, rotatedVector.y, rotatedVector.z]);
};
const applyInterpolatedTransform = (
  animatedPoints: Record<string, Point3D>,
  s_trans: Transformation | undefined,
  e_trans: Transformation | undefined,
  t: number
): Point3D | null => {
  const joint = s_trans?.joint || e_trans?.joint;
  if (!joint) return null;
  if (s_trans?.type === 'relative_translate' && e_trans?.type === 'relative_translate') {
    const relativeTo = animatedPoints[s_trans.relativeTo];
    if (!relativeTo) return null;
    const newOffset = lerpVector(s_trans.offset, e_trans.offset, t);
    return addVectors(relativeTo, newOffset);
  }
  if (s_trans?.type === 'rotate_around_joint' && e_trans?.type === 'rotate_around_joint') {
    const pivot = animatedPoints[s_trans.pivotJoint];
    if (!pivot) return null;
    const newAngle = lerp(s_trans.angle, e_trans.angle, t);
    return applyRotation(pivot, newAngle, s_trans.axis, s_trans.distance);
  }
  if (s_trans?.type === 'relative_translate' && e_trans?.type === 'rotate_around_joint') {
    const pivot = animatedPoints[e_trans.pivotJoint];
    if (!pivot) return null;
    const startAngle = 0; 
    const newAngle = lerp(startAngle, e_trans.angle, t);
    return applyRotation(pivot, newAngle, e_trans.axis, e_trans.distance);
  }
  if (s_trans?.type === 'rotate_around_joint' && e_trans?.type === 'relative_translate') {
    const pivot = animatedPoints[s_trans.pivotJoint];
    if (!pivot) return null;
    const endAngle = 0; 
    const newAngle = lerp(s_trans.angle, endAngle, t);
    return applyRotation(pivot, newAngle, s_trans.axis, s_trans.distance);
  }
  const trans = s_trans || e_trans;
  if (trans?.type === 'relative_translate') {
     const relativeTo = animatedPoints[trans.relativeTo];
     if (!relativeTo) return null;
     return addVectors(relativeTo, trans.offset);
  }
  if (trans?.type === 'rotate_around_joint') {
    const pivot = animatedPoints[trans.pivotJoint];
    if (!pivot) return null;
    return applyRotation(pivot, trans.angle, trans.axis, trans.distance);
  }
  return null;
}
// --- End Helper Functions ---


// --- The Component ---
export default function ExerciseAnimationPreview({
  animationData,
  width: previewWidth = 200,
  height: previewHeight = 200
}: ExerciseAnimationPreviewProps) {
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [projectedPoints, setProjectedPoints] = useState<Record<string, Point2D>>({});
  
  // --- NEW STATE ---
  // Stores the list of joints to highlight
  const [movingParts, setMovingParts] = useState<string[]>([]);

  useEffect(() => {
    if (!animationData) return;

    // Sort keyframes by progress, just in case
    const keyframes = [...animationData.keyframes].sort((a, b) => a.progress - b.progress);
    
    // Create a map of all unique transforms for easier lookup
    const allTransforms = new Map<string, (Transformation | undefined)[]>();
    keyframes.forEach((kf, kf_index) => {
      kf.transformations.forEach(trans => {
        if (!allTransforms.has(trans.joint)) {
          allTransforms.set(trans.joint, new Array(keyframes.length).fill(undefined));
        }
        allTransforms.get(trans.joint)![kf_index] = trans;
      });
    });

    // --- NEW LOGIC: DERIVE MOVING PARTS ---
    // Get all joints that are transformed
    const jointNamesToAnimate = Array.from(allTransforms.keys());
    // Get all joints that are used as pivots or relatives
    const dependencyJoints = new Set<string>();
    keyframes.forEach(kf => {
      kf.transformations.forEach(trans => {
        if (trans.type === 'rotate_around_joint') {
          dependencyJoints.add(trans.pivotJoint);
        } else if (trans.type === 'relative_translate') {
          dependencyJoints.add(trans.relativeTo);
        }
      });
    });
    
    // Combine them all, remove duplicates, and set to state
    const allMovingParts = [
      ...new Set([...jointNamesToAnimate, ...dependencyJoints])
    ];
    setMovingParts(allMovingParts.map(j => j.toLowerCase()));
    // --- END NEW LOGIC ---


    const basePoints3D: Record<string, Point3D> = Object.fromEntries(
      Object.entries(animationData.basePoints).map(([key, value]) => [
        key.toLowerCase(), // Ensure keys are lowercase
        { x: value[0], y: value[1], z: value[2] }
      ])
    );
    
    const centerX = previewWidth / 2;
    const centerY = previewHeight / 2 + 50; 

    const project3DTo2D = (point: Point3D, rotationY: number): Point2D => {
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      const rotatedX = point.x * cosY - point.z * sinY;
      const rotatedZ = point.x * sinY + point.z * cosY;
      
      let perspective = 1;
      if (FOV - rotatedZ !== 0) {
          perspective = FOV / (FOV - rotatedZ);
      }
      
      const screenX = rotatedX * perspective + centerX;
      const screenY = point.y * perspective + centerY; 
      
      return { x: screenX, y: screenY, z: rotatedZ };
    };

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = (currentTime - startTimeRef.current) / 1000;
      const rotationY = elapsed * 0.4; 
      
      const animatedPoints = Object.fromEntries(
        Object.entries(basePoints3D).map(([key, point]) => [key, { ...point }])
      );
      
      // --- ANIMATION LOGIC (Unchanged) ---
      const cycleTime = 2.0; 
      const linearT = elapsed % cycleTime;
      // Use animationType to decide the cycle
      let currentProgress = linearT / cycleTime; // Default: 'loop'
      if (animationData.animationType === 'oscillating') {
        currentProgress = (1 - Math.cos(linearT * Math.PI)) / 2; // 0->1->0
      }

      let startIdx = 0;
      let endIdx = 0;
      for (let i = keyframes.length - 1; i >= 0; i--) {
        if (keyframes[i].progress <= currentProgress) {
          startIdx = i;
          break;
        }
      }
      endIdx = Math.min(startIdx + 1, keyframes.length - 1);

      const startProgress = keyframes[startIdx].progress;
      const endProgress = keyframes[endIdx].progress;
      let t = 0;
      if (endProgress - startProgress > 0) {
        t = (currentProgress - startProgress) / (endProgress - startProgress);
      }
      
      // We assume the transformations array in the *first keyframe*
      // defines the correct dependency order.
      const transformOrder = keyframes[0].transformations.map(t => t.joint);
      
      for (const joint of transformOrder) {
        const s_trans = allTransforms.get(joint)?.[startIdx];
        const e_trans = allTransforms.get(joint)?.[endIdx];

        const newPoint = applyInterpolatedTransform(animatedPoints, s_trans, e_trans, t);
        if (newPoint) {
          animatedPoints[joint] = newPoint;
        }
      }
      // --- END ANIMATION LOGIC ---

      const newProjectedPoints: Record<string, Point2D> = {};
      Object.keys(animatedPoints).forEach((key) => {
        newProjectedPoints[key] = project3DTo2D(animatedPoints[key] as Point3D, rotationY);
      });

      // Scale and center the projected points to fit within the component bounds
      const points = Object.values(newProjectedPoints);
      if (points.length > 0) {
        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const width = maxX - minX || 1; // Avoid division by zero
        const height = maxY - minY || 1;
        const scaleX = previewWidth / width;
        const scaleY = previewHeight / height;
        const scale = Math.min(scaleX, scaleY) * 0.9; // 0.9 for margin
        const offsetX = (previewWidth - width * scale) / 2 - minX * scale;
        const offsetY = (previewHeight - height * scale) / 2 - minY * scale;
        Object.keys(newProjectedPoints).forEach(key => {
          const p = newProjectedPoints[key];
          p.x = p.x * scale + offsetX;
          p.y = p.y * scale + offsetY;
        });
      }

      setProjectedPoints(newProjectedPoints);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animationData, previewWidth, previewHeight]); 

  if (!animationData) {
    // Loading state
    return (
      <ThemedView style={{ width: previewWidth, height: previewHeight, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1f2937', borderRadius: 8 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 4, borderColor: '#4b5563', borderTopColor: '#3b82f6' }} />
      </ThemedView>
    );
  }

  // --- RENDER LOGIC ---
  
  // 'movingParts' now comes from state, derived purely from animationData
 
  const connections = [
    ['neck', 'mid_hip'],
    ['neck', 'left_shoulder'], ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
    ['neck', 'right_shoulder'], ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
    ['mid_hip', 'left_hip'], ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
    ['mid_hip', 'right_hip'], ['right_hip', 'right_knee'], ['right_knee', 'right_ankle']
  ];
  
  const pointKeys = Object.keys(projectedPoints);
  if (pointKeys.length === 0) {
    return <View style={{ width: previewWidth, height: previewHeight, backgroundColor: '#1f2937', borderRadius: 8, overflow: 'hidden' }} />;
  }

  return (
    <View style={{ width: previewWidth, height: previewHeight, backgroundColor: '#1f2937', borderRadius: 8, overflow: 'hidden' }}>
      <Svg width={previewWidth} height={previewHeight}>
        
        {/* 1. Draw all static body connections */}
        {connections.map(([start, end]) => {
          const p1 = projectedPoints[start];
          const p2 = projectedPoints[end];
          if (!p1 || !p2 || isNaN(p1.x) || isNaN(p2.x)) return null; 
          return (
            <Line
              key={`${start}-${end}-static`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#cccccc"
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}

        {/* 2. Draw moving parts on top with highlight */}
        {connections.map(([start, end]) => {
          const isMovingPart = movingParts.includes(start) && movingParts.includes(end);
          if (!isMovingPart) return null;
          
          const p1 = projectedPoints[start];
          const p2 = projectedPoints[end];
          if (!p1 || !p2 || isNaN(p1.x) || isNaN(p2.x)) return null; 
          return (
            <Line
              key={`${start}-${end}-moving`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#ffaa00"
              strokeWidth={3.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* 3. Draw all static joints */}
        {pointKeys.map((key) => {
          const isMoving = movingParts.includes(key);
          if (isMoving) return null;
          
          const point = projectedPoints[key];
          if (!point || isNaN(point.x)) return null; 
          const radius = Math.max(2, 4 * (FOV / (FOV - point.z)));
          return (
            <Circle
              key={`${key}-static`}
              cx={point.x}
              cy={point.y}
              r={radius}
              fill="#cccccc"
            />
          );
        })}
        
        {/* 4. Draw moving joints on top */}
        {pointKeys.map((key) => {
          const isMoving = movingParts.includes(key);
          if (!isMoving) return null;
          
          const point = projectedPoints[key];
          if (!point || isNaN(point.x)) return null; 
          const radius = Math.max(3, 5 * (FOV / (FOV - point.z)));
          return (
            <Circle
              key={`${key}-moving`}
              cx={point.x}
              cy={point.y}
              r={radius}
              fill="#ffaa00"
            />
          );
        })}

      </Svg>
    </View>
  );
}