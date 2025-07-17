import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  correct: number;
  incorrect: number;
  skipped: number;
  total: number;
  size?: number;
};

const CircularProgress = ({ correct, incorrect, skipped, total, size = 50 }: Props) => {
  if (total === 0) {
    return (
      <View style={[styles.percentageCircle, { width: size, height: size, borderRadius: size / 2, borderColor: '#ccc' }]}>
        <Text style={[styles.percentageText, { color: '#999', fontSize: size * 0.2 }]}>Inactive</Text>
      </View>
    );
  }

  const correctPercent = correct / total;
  const strokeWidth = size * 0.12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate the stroke dash array for the green arc
  const greenArcLength = correctPercent * circumference;
  const redArcLength = circumference - greenArcLength;

  return (
    <View style={[styles.percentageCircle, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Red arc - full circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F44336"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={0}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
          strokeLinecap="butt"
        />
        {/* Green arc overlays the correct portion */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#4CAF50"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${greenArcLength},${circumference - greenArcLength}`}
          strokeDashoffset={0}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
          strokeLinecap="butt"
        />
      </Svg>
      <View style={styles.textOverlay}>
        <Text style={[styles.percentageText, { fontSize: size * 0.2, color: correctPercent >= 0.8 ? '#4CAF50' : correctPercent >= 0.6 ? '#FFC107' : '#F44336' }]}>
          {(correctPercent * 100).toFixed(0)}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  percentageCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  percentageText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  textOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CircularProgress; 