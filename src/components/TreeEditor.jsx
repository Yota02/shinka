import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as d3 from 'd3';

const TreeEditor = forwardRef(function TreeEditor(
  { tree, selectedNodeId, onSelect, onAddChild, onDeleteNode, branchStyle, orientation, branchLength },
  ref
) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });
  const [zoom, setZoom] = useState({ k: 1, x: 0, y: 0 });

  const zoomRef = useRef({ k: 1, x: 0, y: 0 });

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useImperativeHandle(ref, () => ({
    node: svgRef.current,
    zoomBy: (factor) => {
      const z = zoomRef.current;
      const newK = Math.min(8, Math.max(0.2, z.k * factor));
      setZoom({ ...z, k: newK });
    },
    resetZoom: () => setZoom({ k: 1, x: 0, y: 0 }),
  }), [dims, zoom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDims({ w: Math.round(width), h: Math.round(height) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const drawTree = ({ w: width, h: height }) => {
    const svg = svgRef.current;
    const svgSel = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);
    svgSel.selectAll('*').remove();

    const isVertical = orientation === 'vertical';
    const margin = isVertical
      ? { top: 60, right: 60, bottom: 120, left: 60 }
      : { top: 60, right: 120, bottom: 60, left: 60 };
    const innerW = Math.max(width - margin.left - margin.right, 200);
    const innerH = Math.max(height - margin.top - margin.bottom, 200);

    const zoomLayer = svgSel.append('g').attr('class', 'zoom-layer');

    if (!tree) {
      zoomLayer
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#95a5a6')
        .attr('font-size', '15px')
        .text('Cliquez sur « Ajouter un nœud » pour commencer');
      return zoomLayer;
    }

    const root = d3.hierarchy(tree);
    root.sum(() => 1);

    const treeLayout = d3.tree().size([innerH, innerW]);
    treeLayout(root);

    const scaleV = (v) => v * (branchLength || 1);
    const sx = (d) => (isVertical ? d.x : scaleV(d.y));
    const sy = (d) => (isVertical ? scaleV(d.y) : d.x);

    const g = zoomLayer
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const linkPath = (d) => {
      const a = [sx(d.source), sy(d.source)];
      const b = [sx(d.target), sy(d.target)];
      if (branchStyle === 'diagonal') {
        return `M${a[0]},${a[1]} L${b[0]},${b[1]}`;
      }
      const midX = (a[0] + b[0]) / 2;
      return `M${a[0]},${a[1]} L${midX},${a[1]} L${midX},${b[1]} L${b[0]},${b[1]}`;
    };

    g.append('g')
      .selectAll('path')
      .data(root.links())
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', '#a0aab5')
      .attr('stroke-width', 2)
      .attr('d', linkPath);

    const allNodes = root.descendants();
    const nodeG = g
      .append('g')
      .selectAll('g')
      .data(allNodes)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${sx(d)},${sy(d)})`)
      .style('cursor', 'pointer');

    nodeG.on('click', (event, d) => {
      event.stopPropagation();
      onSelect(d.data.id);
    });

    nodeG
      .append('circle')
      .attr('r', (d) => (!d.children || d.children.length === 0 ? 6 : 8))
      .attr('fill', (d) => {
        if (d.data.id === selectedNodeId) return '#e67e22';
        return !d.children || d.children.length === 0 ? '#3498db' : '#27ae60';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2.5);

    nodeG
      .filter((d) => !d.children || d.children.length === 0)
      .append('text')
      .attr('x', isVertical ? 0 : 12)
      .attr('y', isVertical ? 16 : 5)
      .attr('text-anchor', isVertical ? 'middle' : 'start')
      .attr('font-size', '13px')
      .attr('fill', (d) => (d.data.id === selectedNodeId ? '#e67e22' : '#2c3e50'))
      .attr('font-weight', (d) => (d.data.id === selectedNodeId ? 'bold' : 'normal'))
      .text((d) => d.data.name || 'Indéterminé');

    nodeG
      .filter((d) => d.children && d.children.length > 0)
      .append('text')
      .attr('x', isVertical ? 0 : -14)
      .attr('y', isVertical ? -14 : -12)
      .attr('text-anchor', isVertical ? 'middle' : 'end')
      .attr('font-size', '11px')
      .attr('fill', '#95a5a6')
      .text((d) => (d.data.name && d.data.name !== 'Racine' ? d.data.name : ''));

    const addBtn = nodeG
      .append('circle')
      .attr('r', 7)
      .attr('cx', isVertical ? 0 : 16)
      .attr('cy', isVertical ? 16 : 0)
      .attr('fill', '#27ae60')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .style('opacity', 0.85)
      .on('mouseenter', function () {
        d3.select(this).style('opacity', 1);
      })
      .on('mouseleave', function () {
        d3.select(this).style('opacity', 0.85);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        onAddChild(d.data.id);
      });
    addBtn.append('title').text('Ajouter un enfant');
    nodeG
      .append('text')
      .attr('x', isVertical ? 0 : 16)
      .attr('y', isVertical ? 20 : 4)
      .attr('font-size', '12px')
      .attr('fill', '#fff')
      .attr('text-anchor', 'middle')
      .style('pointer-events', 'none')
      .text('+');
    nodeG
      .append('circle')
      .attr('r', 12)
      .attr('cx', isVertical ? 0 : 16)
      .attr('cy', isVertical ? 16 : 0)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        onAddChild(d.data.id);
      });

    if (selectedNodeId) {
      nodeG
        .filter((d) => d.data.id === selectedNodeId)
        .append('circle')
        .attr('r', 8)
        .attr('cx', isVertical ? 0 : -16)
        .attr('cy', isVertical ? -16 : 0)
        .attr('fill', '#e74c3c')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .style('opacity', 0.9)
        .append('title')
        .text('Supprimer ce nœud');
      nodeG
        .filter((d) => d.data.id === selectedNodeId)
        .append('text')
        .attr('x', isVertical ? 0 : -16)
        .attr('y', isVertical ? -12 : 4)
        .attr('font-size', '13px')
        .attr('fill', '#fff')
        .attr('text-anchor', 'middle')
        .style('pointer-events', 'none')
        .text('×');
      nodeG
        .filter((d) => d.data.id === selectedNodeId)
        .append('circle')
        .attr('r', 10)
        .attr('cx', isVertical ? 0 : -16)
        .attr('cy', isVertical ? -16 : 0)
        .attr('fill', 'transparent')
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
          event.stopPropagation();
          onDeleteNode(d.data.id);
        });
    }

    nodeG.append('title').text((d) => {
      const n = d.data;
      let t = n.name || 'Indéterminé';
      if (n.note) t += '\n' + n.note;
      return t;
    });

    return zoomLayer;
  };

  useEffect(() => {
    const zoomLayer = drawTree(dims);
    if (zoomLayer) {
      zoomLayer.attr('transform', `translate(${zoom.x},${zoom.y}) scale(${zoom.k})`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, selectedNodeId, dims, branchStyle, orientation, branchLength]);

  // Zoom handlers
  const handleWheel = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const newK = Math.min(8, Math.max(0.2, zoom.k * factor));
    const kRatio = newK / zoom.k;
    const nx = px - (px - zoom.x) * kRatio;
    const ny = py - (py - zoom.y) * kRatio;
    setZoom({ k: newK, x: nx, y: ny });
  };

  const panStart = useRef(null);

  const handleMouseDown = (e) => {
    panStart.current = { x: e.clientX, y: e.clientY, zx: zoom.x, zy: zoom.y };
  };
  const handleMouseMove = (e) => {
    if (!panStart.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setZoom((z) => ({ ...z, x: panStart.current.zx + dx, y: panStart.current.zy + dy }));
  };
  const handleMouseUp = () => {
    panStart.current = null;
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const layer = d3.select(svg).select('.zoom-layer');
    if (layer.empty()) return;
    layer.attr('transform', `translate(${zoom.x},${zoom.y}) scale(${zoom.k})`);
  }, [zoom]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      onClick={() => onSelect(null)}
    >
      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
});

export default TreeEditor;
