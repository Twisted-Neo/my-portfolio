function addText() {
    let input = document.getElementById('input').value;
    if (input.trim() === "") return;
    let li = document.createElement('li');
    li.textContent = input;

    let span = document.createElement('span');
    span.textContent = input;

    let btnD = document.createElement('button');
    btnD.textContent = "Delete";
    btnD.onclick = function() {
        li.remove();
    }

    li.appendChild(btnD);

    document.getElementById('list').appendChild(li);
}

function resetList() {
    document.getElementById('list').innerHTML = '';
}