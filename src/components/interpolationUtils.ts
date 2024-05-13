interface TckFile {
    name: string;
    coordinates: number[][][];
    isVisible: boolean;
    color: string;
    opacity: number;
  }
  

interface InterpolatedTckFile extends TckFile {
  interpolatedCoordinates: number[][][];
}

// Utility function to interpolate additional points between two points
function interpolatePoints(pointA: number[], pointB: number[], interval: number): number[][] {
    const interpolatedPoints: number[][] = [pointA];
    const directionVector = pointB.map((coord, index) => coord - pointA[index]);
    const distance = Math.sqrt(directionVector.reduce((acc, val) => acc + val * val, 0));
    const steps = Math.floor(distance / interval);
    const stepVector = directionVector.map((coord) => coord / (steps + 1));
  
    for (let i = 1; i <= steps; i++) {
      const interpolatedPoint = pointA.map((coord, index) => coord + stepVector[index] * i);
      interpolatedPoints.push(interpolatedPoint);
    }
  
    interpolatedPoints.push(pointB); // Ensure the last point is added
    return interpolatedPoints;
  }
  
  // Function to apply interpolation to all streamlines in a tckFile
  function interpolateStreamlines(tckFile: TckFile, interval: number): InterpolatedTckFile {
    const interpolatedCoordinates = tckFile.coordinates.map((streamline) => {
      const interpolatedStreamline: number[][] = [];
      for (let i = 0; i < streamline.length - 1; i++) {
        const start = streamline[i];
        const end = streamline[i + 1];
        const interpolatedPoints = interpolatePoints(start, end, interval);
        interpolatedStreamline.push(...interpolatedPoints);
      }
      return interpolatedStreamline;
    });

  return {
    ...tckFile,
    interpolatedCoordinates,
  };
}

// When exporting types or interfaces, use `export type`
export type { InterpolatedTckFile };
// Regular exports for functions or values
export { interpolateStreamlines };