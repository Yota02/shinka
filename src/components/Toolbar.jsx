import React from 'react';

export default function Toolbar({
  hasTree,
  onAddRootChild,
  onNewickExport,
  onSvgExport,
  onPngExport,
  onDeleteSelected,
  canDeleteSelected,
  branchStyle,
  onBranchStyleChange,
  orientation,
  onOrientationChange,
  branchLength,
  onBranchLengthChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button className="primary" onClick={onAddRootChild} disabled={!hasTree}>
          ＋ Ajouter un nœud
        </button>
        <button onClick={onDeleteSelected} disabled={!canDeleteSelected} className="danger">
          🗑 Supprimer
        </button>
      </div>
      <div className="toolbar-group">
        <span className="toolbar-label">Branches&nbsp;:</span>
        <button
          className={branchStyle === 'square' ? 'active' : ''}
          onClick={() => onBranchStyleChange('square')}
        >
          ▚ Équerres
        </button>
        <button
          className={branchStyle === 'diagonal' ? 'active' : ''}
          onClick={() => onBranchStyleChange('diagonal')}
        >
          ╱ Diagonales
        </button>
      </div>
      <div className="toolbar-group">
        <span className="toolbar-label">Orientation&nbsp;:</span>
        <button
          className={orientation === 'horizontal' ? 'active' : ''}
          onClick={() => onOrientationChange('horizontal')}
        >
          ↔ Horizontal
        </button>
        <button
          className={orientation === 'vertical' ? 'active' : ''}
          onClick={() => onOrientationChange('vertical')}
        >
          ↕ Vertical
        </button>
      </div>
      <div className="toolbar-group">
        <span className="toolbar-label">Zoom&nbsp;:</span>
        <button onClick={onZoomOut} disabled={!hasTree} title="Dézoomer">
          −
        </button>
        <button onClick={onZoomIn} disabled={!hasTree} title="Zoomer">
          ＋
        </button>
        <button onClick={onResetZoom} disabled={!hasTree} title="Réinitialiser le zoom">
          ⤾
        </button>
      </div>
      <div className="toolbar-group toolbar-length">
        <span className="toolbar-label">Longueur&nbsp;:</span>
        <input
          type="range"
          min="0.25"
          max="3"
          step="0.05"
          value={branchLength}
          onChange={(e) => onBranchLengthChange(parseFloat(e.target.value))}
          disabled={!hasTree}
        />
        <span className="toolbar-value">{branchLength.toFixed(2)}×</span>
      </div>
      <div className="toolbar-group">
        <button onClick={onSvgExport} disabled={!hasTree}>
          ⬇ Exporter SVG
        </button>
        <button onClick={onPngExport} disabled={!hasTree}>
          ⬇ Exporter PNG
        </button>
        <button onClick={onNewickExport} disabled={!hasTree}>
          ⬇ Exporter Newick
        </button>
      </div>
    </div>
  );
}
