import React, { useState, useEffect } from 'react';

export default function NodeEditor({
  node,
  tree,
  onUpdate,
  onDelete,
  onAddChild,
  newick,
  nodeCount,
  leafCount,
  onRenameAll,
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2f6fda');
  const [note, setNote] = useState('');
  const [applyToLeaves, setApplyToLeaves] = useState(false);

  useEffect(() => {
    if (node) {
      setName(node.name || '');
      setColor(node.color || '#2f6fda');
      setNote(node.note || '');
    } else {
      setName('');
      setColor('#2f6fda');
      setNote('');
    }
  }, [node]);

  const isLeaf = node && (!node.children || node.children.length === 0);
  const applyingNameToLeaves = applyToLeaves && isLeaf;

  const handleSave = () => {
    if (!node) return;
    const updates = { name: name.trim(), color, note };
    if (applyingNameToLeaves) {
      onRenameAll(name.trim());
    } else {
      onUpdate(node.id, updates);
    }
  };

  const handleDelete = () => {
    if (node) onDelete();
  };

  const handleAddChild = () => {
    if (node) onAddChild();
  };

  return (
    <div className="side-panel">
      <div className="stats">
        <span>{nodeCount} nœuds</span>
        <span>{leafCount} feuilles</span>
      </div>

      {!node ? (
        <div className="panel-empty">
          <p>
            Sélectionnez un nœud dans l'arbre pour l'éditer.
            <br />
            <br />
            💡 Cliquez sur un nœud, puis utilisez le panneau ici pour renommer,
            colorer ou annoter un taxon.
          </p>
        </div>
      ) : (
        <>
          <h3>
            {isLeaf ? 'Taxon / Feuille' : 'Nœud interne'}
          </h3>

          <div className="form-group">
            <label>Nom du taxon</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isLeaf ? 'Nom de l\'espèce...' : 'Nom du clade...'}
            />
            {isLeaf && (
              <>
                <label style={{ marginTop: '10px', textTransform: 'none' }}>
                  <input
                    type="checkbox"
                    checked={applyToLeaves}
                    onChange={(e) => setApplyToLeaves(e.target.checked)}
                  />{' '}
                  Appliquer ce nom à toutes les feuilles
                </label>
              </>
            )}
          </div>

          <div className="form-group">
            <label>Couleur</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Annotation</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note sur ce taxon..."
            />
            <div className="hint">Note libre affichée uniquement côté édition</div>
          </div>

          <div className="panel-actions">
            <button className="primary" onClick={handleSave}>
              Enregistrer
            </button>
            <button onClick={handleAddChild}>＋ Enfant</button>
            <button className="delete" onClick={handleDelete}>
              Supprimer
            </button>
          </div>
        </>
      )}

      <div className="newick-preview">
        <h4>Aperçu Newick</h4>
        <pre>{newick || '— Aucun arbre —'}</pre>
      </div>
    </div>
  );
}
