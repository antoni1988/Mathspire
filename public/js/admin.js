document.addEventListener("DOMContentLoaded", function () {
  const exerciseForm = document.getElementById("exerciseForm");

  // Only initialize exercise form handling if we're on the exercise edit page
  if (exerciseForm) {
    const typeSelect = exerciseForm.querySelector('select[name="type"]');
    const dynamicFields = document.getElementById("dynamicFields");

    typeSelect.addEventListener("change", updateFormFields);
    exerciseForm.addEventListener("submit", handleExerciseSubmit);

    function updateFormFields() {
      const type = typeSelect.value;
      let fields = "";

      switch (type) {
        case "multiple_choice":
          fields = `
            <div class="mb-3">
              <label class="form-label">Options (one per line)</label>
              <textarea name="options" class="form-control" rows="4" required></textarea>
            </div>
            <div class="mb-3">
              <label class="form-label">Correct Answer (0-based index)</label>
              <input type="number" name="answer" class="form-control" required min="0">
            </div>
          `;
          break;

        case "true_false":
          fields = `
            <div class="mb-3">
              <label class="form-label">Statements (one per line)</label>
              <textarea name="statements" class="form-control" rows="4" required></textarea>
            </div>
            <div class="mb-3">
              <label class="form-label">Answers (comma-separated true/false)</label>
              <input type="text" name="answers" class="form-control" required pattern="^(true|false)(,(true|false))*$">
            </div>
          `;
          break;

        case "open_question":
          fields = `
            <div class="mb-3">
              <label class="form-label">Answer</label>
              <input type="text" name="answer" class="form-control" required>
            </div>
          `;
          break;
      }

      dynamicFields.innerHTML = fields;
    }

    async function handleExerciseSubmit(event) {
      event.preventDefault();
      const formData = new FormData(exerciseForm);
      const topicId = window.location.pathname.split("/")[3];

      try {
        const response = await fetch(`/admin/topics/${topicId}/exercises`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(Object.fromEntries(formData)),
        });

        if (!response.ok) throw new Error("Network response was not ok");

        const exercise = await response.json();
        updateExercisesList(exercise);
        exerciseForm.reset();
        dynamicFields.innerHTML = "";
      } catch (error) {
        console.error("Error:", error);
        alert("Error saving exercise");
      }
    }

    // Initialize form fields on load
    updateFormFields();
  }

  function updateExercisesList(exercise) {
    const exercisesList = document.getElementById("exercisesList");
    if (!exercisesList) return;

    const exerciseElement = document.createElement("div");
    exerciseElement.className = "list-group-item";
    exerciseElement.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h6 class="mb-1">Question ${exercise.id}</h6>
          <p class="mb-1">${exercise.question}</p>
          <small class="text-muted">Type: ${exercise.type}</small>
        </div>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-danger">Delete</button>
        </div>
      </div>
    `;
    exercisesList.appendChild(exerciseElement);
  }
});
