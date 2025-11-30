"use client";

import { useState } from "react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";

interface TodoItem {
  id: string;
  text: string;
  description?: string;
  completed: boolean;
}

interface TodoWidgetProps {
  initialTodos?: TodoItem[];
}

export function TodoWidget({ initialTodos = [] }: TodoWidgetProps) {
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos);
  const [newTodo, setNewTodo] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTodo = () => {
    if (!newTodo.trim()) return;

    setTodos([
      ...todos,
      {
        id: Date.now().toString(),
        text: newTodo.trim(),
        completed: false,
      },
    ]);
    setNewTodo("");
    setIsAdding(false);
  };

  const handleToggle = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTodo();
    } else if (e.key === "Escape") {
      setIsAdding(false);
      setNewTodo("");
    }
  };

  const incompleteTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
      <h3 className="text-sm font-medium text-gray-900 mb-3">
        To-do ({incompleteTodos.length})
      </h3>

      {/* Add todo button/input */}
      {isAdding ? (
        <div className="mb-3">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!newTodo.trim()) setIsAdding(false);
            }}
            placeholder="What needs to be done?"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAddTodo}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewTodo("");
              }}
              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 mb-3"
        >
          <PlusCircleIcon className="w-4 h-4" />
          Add a to-do
        </button>
      )}

      {/* Todo list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {incompleteTodos.map((todo) => (
          <div key={todo.id} className="flex items-start gap-3 py-2 border-b border-gray-100">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggle(todo.id)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{todo.text}</p>
              {todo.description && (
                <p className="text-xs text-gray-500 mt-0.5">{todo.description}</p>
              )}
            </div>
          </div>
        ))}

        {completedTodos.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-gray-500 mb-2">
              Completed ({completedTodos.length})
            </p>
            {completedTodos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-start gap-3 py-2 border-b border-gray-100 opacity-60"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo.id)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 line-through">{todo.text}</p>
              </div>
            ))}
          </div>
        )}

        {todos.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No to-dos yet. Add one to get started!
          </p>
        )}
      </div>
    </div>
  );
}
