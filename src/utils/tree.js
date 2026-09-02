let nodeCounter = 0;

export function createNode(name = '') {
  nodeCounter += 1;
  return {
    id: `n${nodeCounter}_${Date.now()}`,
    name,
    children: [],
    color: '#2f6fda',
    note: '',
  };
}

export function createRootNode() {
  return createNode('Racine');
}

export function escapeName(name) {
  return name.replace(/([(),:\[\]])/g, '');
}

export function getLeaves(tree) {
  const leaves = [];
  const walk = (node, depth) => {
    if (!node.children || node.children.length === 0) {
      leaves.push({ node, depth });
      return;
    }
    node.children.forEach((child) => walk(child, depth + 1));
  };
  walk(tree, 0);
  return leaves;
}

export function countNodes(tree) {
  let count = 1;
  const walk = (node) => {
    node.children.forEach((child) => {
      count += 1;
      walk(child);
    });
  };
  walk(tree);
  return count;
}

export function countLeaves(tree) {
  return getLeaves(tree).length;
}

export function findNode(tree, targetId) {
  if (tree.id === targetId) return tree;
  for (const child of tree.children || []) {
    const found = findNode(child, targetId);
    if (found) return found;
  }
  return null;
}

export function findParent(tree, targetId, parent = null) {
  if (tree.id === targetId) return parent;
  for (const child of tree.children || []) {
    const found = findParent(child, targetId, tree);
    if (found) return found;
  }
  return null;
}

export function removeNode(tree, targetId) {
  if (tree.id === targetId) return null;
  const children = tree.children || [];
  for (let i = 0; i < children.length; i++) {
    if (children[i].id === targetId) {
      const removed = children.splice(i, 1)[0];
      return { tree, removed };
    }
    const result = removeNode(children[i], targetId);
    if (result) return result;
  }
  return null;
}

export function addChild(tree, parentId, child) {
  const parent = findNode(tree, parentId);
  if (!parent) return tree;
  if (!parent.children) parent.children = [];
  parent.children.push(child);
  return tree;
}

export function toNewick(node) {
  if (!node.children || node.children.length === 0) {
    return escapeName(node.name || '');
  }
  const childrenStr = node.children.map((c) => toNewick(c)).join(',');
  const label = node.name ? `${childrenStr}${escapeName(node.name)}` : childrenStr;
  return `(${label})`;
}

export function treeToNewick(tree) {
  return toNewick(tree) + ';';
}

export function parseNewickToSAX(str) {
  const stack = [];
  let currentNode = null;
  let currentLabel = '';
  let i = 0;

  const flushLabel = () => {
    if (currentLabel.length > 0) {
      if (currentNode) {
        currentNode.name = currentLabel.trim();
      }
      currentLabel = '';
    }
  };

  while (i < str.length) {
    const char = str[i];
    if (char === '(') {
      const newNode = createNode();
      if (currentNode) {
        if (!currentNode.children) currentNode.children = [];
        currentNode.children.push(newNode);
      }
      stack.push(currentNode);
      currentNode = newNode;
      flushLabel();
      i++;
    } else if (char === ',') {
      flushLabel();
      if (currentNode) {
        const sibling = createNode();
        const parent = stack[stack.length - 1];
        if (parent) {
          parent.children.push(sibling);
        }
        currentNode = sibling;
      }
      i++;
    } else if (char === ')') {
      flushLabel();
      currentNode = stack.pop() || null;
      i++;
    } else if (char === ';') {
      flushLabel();
      break;
    } else if (char === ':') {
      let j = i + 1;
      while (j < str.length && /[0-9.]/.test(str[j])) j++;
      i = j;
    } else {
      currentLabel += char;
      i++;
    }
  }

  return currentNode || createNode('Racine');
}
