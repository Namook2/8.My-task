// 카테고리 select/필터 값(영문)과 데이터 모델의 category 값(한글) 간 매핑
const CATEGORY_LABELS = {
  work: "업무",
  personal: "개인",
  study: "공부",
};

const CATEGORY_KEYS = {
  업무: "work",
  개인: "personal",
  공부: "study",
};

// localStorage 키 (요구사항: 할 일 배열은 "todos" 키에 JSON으로 저장)
const STORAGE_KEY = "todos";
// 필터 선택도 새로고침 후 유지되도록 별도 키에 보조 저장
const FILTER_STORAGE_KEY = "todoFilter";
const FILTER_VALUES = ["all", "work", "personal", "study"];

// 메모리 상의 할 일 목록 상태 (loadTodos()로 초기화됨)
let todos = [];

// 현재 선택된 필터 (all/work/personal/study) - 데이터 자체와는 분리된 뷰 상태
let currentFilter = "all";

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadFilter() {
  try {
    const raw = localStorage.getItem(FILTER_STORAGE_KEY);
    return FILTER_VALUES.includes(raw) ? raw : "all";
  } catch (e) {
    return "all";
  }
}

function saveFilter() {
  localStorage.setItem(FILTER_STORAGE_KEY, currentFilter);
}

const todoInput = document.getElementById("todo-input");
const categorySelect = document.getElementById("category-select");
const addBtn = document.getElementById("add-btn");
const todoListEl = document.getElementById("todo-list");
const filterBtns = document.querySelectorAll(".filter-btn");
const progressText = document.getElementById("progress-text");
const progressBarFill = document.getElementById("progress-bar-fill");
const completedToggleBtn = document.getElementById("completed-toggle");
const completedListEl = document.getElementById("completed-list");
const completedCountEl = document.getElementById("completed-count");

// 완료된 항목 영역이 펼쳐져 있는지 여부 (기본은 접힘)
let showCompleted = false;

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function addTodo() {
  const title = todoInput.value.trim();
  if (!title) {
    todoInput.focus();
    return;
  }

  const todo = {
    id: createId(),
    title,
    category: CATEGORY_LABELS[categorySelect.value],
    completed: false,
    createdAt: new Date().toISOString(),
  };

  todos.push(todo);
  todoInput.value = "";
  todoInput.focus();
  refresh();
}

function findTodoById(id) {
  return todos.find((t) => t.id === id);
}

function toggleComplete(id) {
  const todo = findTodoById(id);
  if (!todo) return;
  todo.completed = !todo.completed;
  refresh();
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  refresh();
}

function editTodo(id, newTitle) {
  const title = newTitle.trim();
  if (!title) return;
  const todo = findTodoById(id);
  if (!todo) return;
  todo.title = title;
  refresh();
}

function enterEditMode(li, todo) {
  const titleEl = li.querySelector(".todo-item-title");
  const input = document.createElement("input");
  input.type = "text";
  input.className = "todo-item-edit-input";
  input.value = todo.title;

  let finished = false;
  const finishEdit = (commit) => {
    if (finished) return;
    finished = true;
    if (commit) {
      editTodo(todo.id, input.value);
    } else {
      renderTodos();
    }
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finishEdit(true);
    if (e.key === "Escape") finishEdit(false);
  });
  input.addEventListener("blur", () => finishEdit(true));

  titleEl.replaceWith(input);
  input.focus();
  input.select();
}

function createTodoItemEl(todo) {
  const li = document.createElement("li");
  li.className = `todo-item category-${CATEGORY_KEYS[todo.category]}`;
  li.dataset.id = todo.id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "todo-item-checkbox";
  checkbox.checked = todo.completed;
  checkbox.setAttribute("aria-label", `${todo.title} 완료 여부`);
  checkbox.addEventListener("change", () => toggleComplete(todo.id));

  const title = document.createElement("span");
  title.className = "todo-item-title" + (todo.completed ? " completed" : "");
  title.textContent = todo.title;
  title.addEventListener("click", () => enterEditMode(li, todo));

  const category = document.createElement("span");
  category.className = "todo-item-category";
  category.textContent = todo.category;

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "todo-item-edit";
  editBtn.textContent = "수정";
  editBtn.addEventListener("click", () => enterEditMode(li, todo));

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "todo-item-delete";
  deleteBtn.textContent = "삭제";
  deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

  li.append(checkbox, title, category, editBtn, deleteBtn);
  return li;
}

// 필터링: 데이터(todos)는 건드리지 않고 화면에 보여줄 부분집합만 계산
function getFilteredTodos() {
  if (currentFilter === "all") return todos;
  return todos.filter(
    (todo) => CATEGORY_KEYS[todo.category] === currentFilter
  );
}

// 렌더링: 현재 필터를 적용한 뒤, 미완료 항목은 메인 목록에,
// 완료된 항목은 별도의 "완료된 항목" 영역에 나눠서 그림
function renderTodos() {
  const filtered = getFilteredTodos();
  const activeTodos = filtered.filter((todo) => !todo.completed);
  const completedTodos = filtered.filter((todo) => todo.completed);

  todoListEl.innerHTML = "";
  if (activeTodos.length === 0) {
    todoListEl.appendChild(createEmptyStateEl(filtered.length));
  } else {
    activeTodos.forEach((todo) => {
      todoListEl.appendChild(createTodoItemEl(todo));
    });
  }

  renderCompletedList(completedTodos);
}

function createEmptyStateEl(filteredTotal) {
  const li = document.createElement("li");
  li.className = "empty-state";
  li.textContent =
    filteredTotal === 0
      ? "할 일이 없습니다. 새로운 할 일을 추가해보세요."
      : "모든 할 일을 완료했습니다! 완료된 항목은 아래에서 확인하세요.";
  return li;
}

function renderCompletedList(completedTodos) {
  completedListEl.innerHTML = "";
  completedTodos.forEach((todo) => {
    completedListEl.appendChild(createTodoItemEl(todo));
  });

  completedCountEl.textContent = completedTodos.length;
  completedToggleBtn.disabled = completedTodos.length === 0;
}

function toggleCompletedSection() {
  showCompleted = !showCompleted;
  completedListEl.classList.toggle("collapsed", !showCompleted);
  completedToggleBtn.classList.toggle("expanded", showCompleted);
  completedToggleBtn.setAttribute("aria-expanded", String(showCompleted));
}

// 진행률: 필터와 무관하게 전체 todos 기준으로 계산
function updateProgress() {
  const total = todos.length;
  const completedCount = todos.filter((todo) => todo.completed).length;
  const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  progressText.textContent = `${total}개 중 ${completedCount}개 완료 (${percent}%)`;
  progressBarFill.style.width = `${percent}%`;
}

function syncFilterButtons() {
  filterBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === currentFilter);
  });
}

// 목록/진행률만 다시 그림 (저장은 하지 않음 - 초기 로드 시 재사용)
function render() {
  renderTodos();
  updateProgress();
}

// 데이터가 바뀌는 액션 끝에서 호출: 다시 그리고 저장까지 함께 수행
function refresh() {
  render();
  saveTodos();
}

function setFilter(filter) {
  currentFilter = filter;
  syncFilterButtons();
  renderTodos();
  saveFilter();
}

addBtn.addEventListener("click", addTodo);
todoInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTodo();
});

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => setFilter(btn.dataset.filter));
});

completedToggleBtn.addEventListener("click", toggleCompletedSection);

function init() {
  todos = loadTodos();
  currentFilter = loadFilter();
  syncFilterButtons();
  render();
}

init();
