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

// 메모리 상의 할 일 목록 상태 (이 단계에서는 localStorage 연동 없음)
let todos = [];

const todoInput = document.getElementById("todo-input");
const categorySelect = document.getElementById("category-select");
const addBtn = document.getElementById("add-btn");
const todoListEl = document.getElementById("todo-list");

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
  renderTodos();
}

function toggleComplete(id) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;
  todo.completed = !todo.completed;
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  renderTodos();
}

function editTodo(id, newTitle) {
  const title = newTitle.trim();
  if (!title) return;
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;
  todo.title = title;
  renderTodos();
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

function renderTodos() {
  todoListEl.innerHTML = "";
  todos.forEach((todo) => {
    todoListEl.appendChild(createTodoItemEl(todo));
  });
}

addBtn.addEventListener("click", addTodo);
todoInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTodo();
});

renderTodos();
