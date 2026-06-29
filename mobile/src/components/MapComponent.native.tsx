import React from 'react';
import MapView, { Marker, UrlTile, Polyline } from 'react-native-maps';

export default function MapComponent({ style, initialRegion, markers, routeCoordinates }: any) {
  return (
    <MapView 
      style={style} 
      initialRegion={initialRegion}
      mapType="none" // Hides the default Google/Apple map tiles
    >
      <UrlTile
        urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maximumZ={19}
        flipY={false}
      />
      
      {routeCoordinates && routeCoordinates.length > 0 && (
        <Polyline 
          coordinates={routeCoordinates}
          strokeColor="#3b82f6"
          strokeWidth={4}
        />
      )}

      {markers && markers.map((m: any, idx: number) => (
        <Marker 
          key={m.key || idx} 
          coordinate={m.coordinate} 
          title={m.title} 
          description={m.description} 
          pinColor={m.pinColor} 
          rotation={m.heading || 0} // Support for exact view direction
          flat={true} // Keeps the marker flat against the map for rotation
        />
      ))}
    </MapView>
  );
}
