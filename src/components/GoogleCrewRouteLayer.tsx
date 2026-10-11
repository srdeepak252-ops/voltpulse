import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { DispatchCrew, OutageIncident } from '../types';

interface GoogleCrewRouteLayerProps {
  crews: DispatchCrew[];
  incidents: OutageIncident[];
  showRoutes?: boolean;
}

/**
 * GoogleCrewRouteLayer renders dynamic, glowing vector polylines connecting active utility crews
 * in EN_ROUTE status to their destination incident coordinates, with animated directional indicators.
 */
export function GoogleCrewRouteLayer({
  crews,
  incidents,
  showRoutes = true,
}: GoogleCrewRouteLayerProps) {
  const map = useMap();
  const polylinesRef = useRef<Map<string, google.maps.Polyline>>(new Map());
  const trailsRef = useRef<Map<string, google.maps.Polyline>>(new Map());

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) {
      return;
    }

    if (!showRoutes) {
      // Remove all active polylines if toggled off
      polylinesRef.current.forEach((line) => line.setMap(null));
      polylinesRef.current.clear();
      trailsRef.current.forEach((line) => line.setMap(null));
      trailsRef.current.clear();
      return;
    }

    const currentCrewIds = new Set<string>();

    crews.forEach((crew) => {
      if (crew.status !== 'EN_ROUTE' || !crew.lat || !crew.lng) {
        // If crew is no longer en-route, clear polyline
        if (polylinesRef.current.has(crew.id)) {
          polylinesRef.current.get(crew.id)?.setMap(null);
          polylinesRef.current.delete(crew.id);
        }
        if (trailsRef.current.has(crew.id)) {
          trailsRef.current.get(crew.id)?.setMap(null);
          trailsRef.current.delete(crew.id);
        }
        return;
      }

      // Find target location
      let targetLat = crew.targetLat;
      let targetLng = crew.targetLng;

      if (!targetLat || !targetLng) {
        const targetInc =
          incidents.find((i) => i.id === crew.targetIncidentId) ||
          incidents.find((i) => i.code === crew.currentIncidentCode);
        if (targetInc) {
          targetLat = targetInc.lat;
          targetLng = targetInc.lng;
        }
      }

      if (!targetLat || !targetLng) return;

      currentCrewIds.add(crew.id);

      const pathCoords = [
        { lat: crew.lat, lng: crew.lng },
        { lat: targetLat, lng: targetLng },
      ];

      // Update or create main trajectory line
      let polyline = polylinesRef.current.get(crew.id);
      if (!polyline) {
        polyline = new google.maps.Polyline({
          path: pathCoords,
          geodesic: true,
          strokeColor: '#06b6d4', // Cyan utility color
          strokeOpacity: 0.85,
          strokeWeight: 4,
          icons: [
            {
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 3,
                strokeColor: '#ffffff',
                fillColor: '#06b6d4',
                fillOpacity: 1,
                strokeWeight: 1.5,
              },
              offset: '50%',
              repeat: '80px',
            },
          ],
          map: map,
        });
        polylinesRef.current.set(crew.id, polyline);
      } else {
        polyline.setPath(pathCoords);
        if (polyline.getMap() !== map) {
          polyline.setMap(map);
        }
      }

      // Render past breadcrumb trail if available
      if (crew.breadcrumbs && crew.breadcrumbs.length > 1) {
        let trailLine = trailsRef.current.get(crew.id);
        const trailPath = crew.breadcrumbs.map((b) => ({ lat: b.lat, lng: b.lng }));
        if (!trailLine) {
          trailLine = new google.maps.Polyline({
            path: trailPath,
            geodesic: true,
            strokeColor: '#38bdf8',
            strokeOpacity: 0.45,
            strokeWeight: 2.5,
            map: map,
          });
          trailsRef.current.set(crew.id, trailLine);
        } else {
          trailLine.setPath(trailPath);
          if (trailLine.getMap() !== map) {
            trailLine.setMap(map);
          }
        }
      }
    });

    // Remove lines for crews no longer active
    polylinesRef.current.forEach((line, crewId) => {
      if (!currentCrewIds.has(crewId)) {
        line.setMap(null);
        polylinesRef.current.delete(crewId);
      }
    });
    trailsRef.current.forEach((line, crewId) => {
      if (!currentCrewIds.has(crewId)) {
        line.setMap(null);
        trailsRef.current.delete(crewId);
      }
    });
  }, [map, crews, incidents, showRoutes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      polylinesRef.current.forEach((line) => line.setMap(null));
      polylinesRef.current.clear();
      trailsRef.current.forEach((line) => line.setMap(null));
      trailsRef.current.clear();
    };
  }, []);

  return null;
}
