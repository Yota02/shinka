import React, { useCallback, useEffect, useRef, useState } from 'react';
import TreeEditor from './components/TreeEditor';
import Toolbar from './components/Toolbar';
import NodeEditor from './components/NodeEditor';
import {
  createRootNode,
  createNode,
  addChild,
  removeNode,
  findNode,
  treeToNewick,
  countNodes,
  countLeaves,
} from './utils/tree';
import { toPng, toSvg } from 'html-to-image';
import './styles/styles.css';
export default function App() {
  const [tree, setTree] = useState(() => createDemoTree());
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [newick, setNewick] = useState('');
  const [branchStyle, setBranchStyle] = useState('square');
  const [orientation, setOrientation] = useState('horizontal');
  const [branchLength, setBranchLength] = useState(1);
  const editorRef = useRef(null);

  const hasTree = tree !== null;

  useEffect(() => {
    if (tree) {
      setNewick(treeToNewick(tree));
    }
  }, [tree]);

  const handleSelect = useCallback((nodeId) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleAddChild = useCallback((parentId) => {
    setSelectedNodeId(parentId);
    setTree((current) => {
      if (!current) return current;
      const child = createNode('');
      return addChild(cloneTree(current), parentId, child);
    });
  }, []);

  const handleAddRootChild = useCallback(() => {
    setTree((current) => {
      if (!current) return current;
      const clone = cloneTree(current);
      clone.children.push(createNode('Espèce'));
      return clone;
    });
    setSelectedNodeId(null);
  }, []);

  const handleDeleteNode = useCallback((nodeId) => {
    if (nodeId === tree.id) {
      setTree(null);
      setSelectedNodeId(null);
      setNewick('');
      return;
    }
    setTree((current) => {
      if (!current) return current;
      const result = removeNode(cloneTree(current), nodeId);
      return result ? result.tree : current;
    });
    setSelectedNodeId(null);
  }, [tree.id]);

  const handleUpdateNode = useCallback((nodeId, updates) => {
    setTree((current) => {
      if (!current) return current;
      const clone = cloneTree(current);
      const node = findNode(clone, nodeId);
      if (node) Object.assign(node, updates);
      return clone;
    });
  }, []);

  const handleRenameAll = useCallback((newName) => {
    setTree((current) => {
      if (!current) return current;
      const clone = cloneTree(current);
      const walk = (node) => {
        if (!node.children || node.children.length === 0) {
          node.name = newName;
        }
        node.children.forEach(walk);
      };
      walk(clone);
      return clone;
    });
  }, []);

  const handleExport = useCallback((format) => {
    const editor = editorRef.current;
    const node = editor && editor.node;
    if (!node) return;

    if (format === 'png') {
      toPng(node, { pixelRatio: 2, backgroundColor: '#ffffff' }).then((dataUrl) => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'arbre-phylogenetique.png';
        a.click();
      });
    } else if (format === 'svg') {
      toSvg(node, { backgroundColor: '#ffffff' }).then((dataUrl) => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'arbre-phylogenetique.svg';
        a.click();
      });
    } else if (format === 'newick') {
      const blob = new Blob([newick], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'arbre-phylogenetique.newick';
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [newick]);

  const handleZoomIn = useCallback(() => {
    editorRef.current && editorRef.current.zoomBy(1.2);
  }, []);

  const handleZoomOut = useCallback(() => {
    editorRef.current && editorRef.current.zoomBy(1 / 1.2);
  }, []);

  const handleResetZoom = useCallback(() => {
    editorRef.current && editorRef.current.resetZoom();
  }, []);

  const selectedNode = selectedNodeId ? findNode(tree, selectedNodeId) : null;

  return (
    <div className="app">
      <Toolbar
        hasTree={hasTree}
        onAddRootChild={handleAddRootChild}
        onNewickExport={() => handleExport('newick')}
        onSvgExport={() => handleExport('svg')}
        onPngExport={() => handleExport('png')}
        onDeleteSelected={() => selectedNodeId && handleDeleteNode(selectedNodeId)}
        canDeleteSelected={!!selectedNodeId}
        branchStyle={branchStyle}
        onBranchStyleChange={setBranchStyle}
        orientation={orientation}
        onOrientationChange={setOrientation}
        branchLength={branchLength}
        onBranchLengthChange={setBranchLength}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />
      <div className="main">
        <div className="canvas-container">
          <TreeEditor
            ref={editorRef}
            tree={tree}
            selectedNodeId={selectedNodeId}
            onSelect={handleSelect}
            onAddChild={handleAddChild}
            onDeleteNode={handleDeleteNode}
            branchStyle={branchStyle}
            orientation={orientation}
            branchLength={branchLength}
          />
        </div>
        <NodeEditor
          node={selectedNode}
          tree={tree}
          onUpdate={handleUpdateNode}
          onDelete={() => selectedNodeId && handleDeleteNode(selectedNodeId)}
          onAddChild={() => selectedNodeId && handleAddChild(selectedNodeId)}
          newick={newick}
          nodeCount={hasTree ? countNodes(tree) : 0}
          leafCount={hasTree ? countLeaves(tree) : 0}
          onRenameAll={handleRenameAll}
        />
      </div>
    </div>
  );
}

function cloneTree(node) {
  if (!node) return null;
  return {
    ...node,
    children: (node.children || []).map(cloneTree),
  };
}

function createDemoTree() {
  const root = createNode('Racine');
  const mammal = createNode('Mammifères');
  const bird = createNode('Oiseaux');
  const human = createNode('Homo sapiens');
  const dog = createNode('Canis lupus');
  const sparrow = createNode('Passer domesticus');
  human.children = [];
  dog.children = [];
  sparrow.children = [];
  mammal.children = [human, dog];
  bird.children = [sparrow];
  root.children = [mammal, bird];
  return root;
}
