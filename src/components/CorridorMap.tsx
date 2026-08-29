import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CorridorNode, CorridorLink } from '../types';
import { CORRIDOR_NODES, CORRIDOR_LINKS } from '../data/mockData';

interface CorridorMapProps {
  height?: string;
  onSelectNode?: (node: CorridorNode) => void;
  focusNodeIds?: string[]; // when set, fits bounds to just these nodes
  interactive?: boolean;
  selectedNodeId?: string | null;
  showZoomControl?: boolean;
}

const STATUS_COLOR: Record<CorridorNode['status'], string> = {
  delay: '#842029',
  maintenance: '#D4AF37',
  normal: '#1A1A1A',
};

const LINK_COLOR: Record<CorridorLink['status'], string> = {
  delay: '#842029',
  maintenance: '#D4AF37',
  normal: '#8C8C8C',
};

function buildNodeIcon(node: CorridorNode, isSelected: boolean): L.DivIcon {
  const color = STATUS_COLOR[node.status];
  const size = isSelected ? 22 : 16;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;
      height:${size}px;
      border-radius:9999px;
      background:${color};
      border:3px solid #FFFFFF;
      box-shadow:0 0 0 3px ${color}55, 0 1px 4px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Helper: fits the map to given bounds whenever the node set changes
function FitBounds({ nodes }: { nodes: CorridorNode[] }) {
  const map = useMap();
  React.useEffect(() => {
    if (nodes.length === 0) return;
    if (nodes.length === 1) {
      map.setView([nodes[0].lat, nodes[0].lng], 6);
      return;
    }
    const bounds = L.latLngBounds(nodes.map((n) => [n.lat, n.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [36, 36] });
  }, [nodes, map]);
  return null;
}

export const CorridorMap: React.FC<CorridorMapProps> = ({
  height = '100%',
  onSelectNode,
  focusNodeIds,
  interactive = true,
  selectedNodeId = null,
  showZoomControl = false,
}) => {
  const nodes = useMemo(
    () =>
      focusNodeIds && focusNodeIds.length > 0
        ? CORRIDOR_NODES.filter((n) => focusNodeIds.includes(n.id))
        : CORRIDOR_NODES,
    [focusNodeIds]
  );

  const nodeMap = useMemo(() => {
    const m: Record<string, CorridorNode> = {};
    CORRIDOR_NODES.forEach((n) => (m[n.id] = n));
    return m;
  }, []);

  // Only draw links where both endpoints are within the currently visible node set
  const visibleLinks = useMemo(
    () =>
      CORRIDOR_LINKS.filter(
        (l) => nodes.some((n) => n.id === l.from) && nodes.some((n) => n.id === l.to)
      ),
    [nodes]
  );

  const center: [number, number] = [22.5, 79.5]; // roughly the centroid of India

  return (
    <div style={{ height, width: '100%', position: 'relative' }} className="corridor-map-wrapper">
      <MapContainer
        center={center}
        zoom={4.4}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        zoomControl={showZoomControl}
        touchZoom={interactive}
        style={{ height: '100%', width: '100%', background: '#EAE8E2' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds nodes={nodes} />

        {visibleLinks.map((link) => {
          const from = nodeMap[link.from];
          const to = nodeMap[link.to];
          if (!from || !to) return null;
          return (
            <Polyline
              key={`${link.from}-${link.to}`}
              positions={[
                [from.lat, from.lng],
                [to.lat, to.lng],
              ]}
              pathOptions={{
                color: LINK_COLOR[link.status],
                weight: link.status === 'normal' ? 2 : 3,
                opacity: 0.75,
                dashArray: link.status === 'maintenance' ? '6 4' : undefined,
              }}
            />
          );
        })}

        {nodes.map((node) => (
          <Marker
            key={node.id}
            position={[node.lat, node.lng]}
            icon={buildNodeIcon(node, node.id === selectedNodeId)}
            eventHandlers={{
              click: () => onSelectNode && onSelectNode(node),
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <span className="text-xs font-semibold">
                {node.name} ({node.code})
              </span>
              <br />
              <span className="text-[11px] text-[#737067]">
                {node.activeBlocksCount} active blocks • {node.defectsCount} defects
              </span>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
