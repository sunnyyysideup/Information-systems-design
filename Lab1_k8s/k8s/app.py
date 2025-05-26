from flask import Flask, request, render_template_string
app = Flask(__name__)
items = []

@app.route('/', methods=['GET', 'POST'])
def home():
    if request.method == 'POST':
        item = request.form['item']
        items.append(item)
    return render_template_string("""
        <h1>Список "Хочу посмотреть/прочитать"</h1>
        <form method="POST">
            <input name="item">
            <button type="submit">Добавить</button>
        </form>
        <ul>
            {% for i in items %}
                <li>{{ i }}</li>
            {% endfor %}
        </ul>
    """, items=items)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
