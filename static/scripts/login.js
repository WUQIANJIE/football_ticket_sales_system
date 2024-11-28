// WU Qianjie & WANG Kaiyuan
document.addEventListener('DOMContentLoaded', () => {
  const loginButton = document.getElementById('loginButton');

  // Handle remember me
  var isRememberMe = localStorage.getItem('rememberID');
  if (isRememberMe == 'true') {
    $('#rememberID').attr('checked', true);
    $('#username').val(localStorage.getItem('userID'));
  } else {
    $('#rememberID').attr('checked', false);
    $('#username').val('');
  }

  loginButton.addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
      alert('Username and password cannot be empty');
      return;
    }

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    console.log(formData);

    fetch('/auth/login', {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        return response.json().then((data) => {
          // Handle remember me
          var rememberIDCheckbox = $('#rememberID').prop('checked');
          if (rememberIDCheckbox) {
            localStorage.setItem('rememberID', 'true');
            localStorage.setItem('userID', username);
          } else {
            localStorage.removeItem('rememberID');
            localStorage.removeItem('userID');
          }

          if (!response.ok) {
            if (response.status === 401) {
              alert(data.message || `User '${username}' is currently disabled`);
            } else {
              alert(`User '${username}' is currently disabled`);
            }
            throw new Error('Login failed');
          }
          return data;
        });
      })
      .then((data) => {
        alert(`Logged as '${data.user.username}' (${data.user.role})`);
        window.location.href = '/index.html';
      })
      .catch((error) => {
        console.error('Error:', error);
        alert('Unknown error');
      });
  });
});
