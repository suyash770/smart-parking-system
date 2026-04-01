/**
 * MinHeap — O(log n) insert & extract-min.
 * Direct port of Java's PriorityQueue<ParkingSlot> used in the
 * original DSA core logic.  Stores simple numeric slot numbers;
 * the smallest number (nearest slot) is always at the top.
 */
class MinHeap {
  constructor() {
    this.heap = [];
  }

  // ---- helpers ----
  _parent(i) { return Math.floor((i - 1) / 2); }
  _left(i)   { return 2 * i + 1; }
  _right(i)  { return 2 * i + 2; }

  _swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  // ---- bubble up after insert ----
  _bubbleUp(i) {
    while (i > 0 && this.heap[i] < this.heap[this._parent(i)]) {
      this._swap(i, this._parent(i));
      i = this._parent(i);
    }
  }

  // ---- bubble down after extract ----
  _bubbleDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = this._left(i);
      const r = this._right(i);

      if (l < n && this.heap[l] < this.heap[smallest]) smallest = l;
      if (r < n && this.heap[r] < this.heap[smallest]) smallest = r;

      if (smallest === i) break;
      this._swap(i, smallest);
      i = smallest;
    }
  }

  // ---- public API ----

  /** Insert a slot number into the heap.  O(log n) */
  insert(val) {
    this.heap.push(val);
    this._bubbleUp(this.heap.length - 1);
  }

  /** Remove and return the smallest slot number.  O(log n) */
  extractMin() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._bubbleDown(0);
    }
    return min;
  }

  /** Peek at the smallest value without removing it. */
  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  /** Current number of elements in the heap. */
  size() {
    return this.heap.length;
  }

  /** Return a sorted copy of all values (for display purposes). */
  values() {
    return [...this.heap].sort((a, b) => a - b);
  }
}

module.exports = MinHeap;
