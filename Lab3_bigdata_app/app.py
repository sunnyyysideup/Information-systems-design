import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from flask import Flask, request, render_template, url_for
from sklearn.linear_model import RidgeCV
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error
from sklearn.preprocessing import StandardScaler
import numpy as np

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['STATIC_FOLDER'] = 'static'

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['STATIC_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return render_template('upload.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    file = request.files['file']
    if not file or file.filename == '':
        return 'Файл не выбран.'
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(filepath)
    df = pd.read_csv(filepath)
    columns = df.columns.tolist()

    plt.figure(figsize=(8, 6))
    sns.heatmap(df.corr(), annot=True, cmap='coolwarm')
    heatmap_path = os.path.join(app.config['STATIC_FOLDER'], 'heatmap.png')
    plt.title('Корреляционная матрица')
    plt.tight_layout()
    plt.savefig(heatmap_path)
    plt.close()

    return render_template('choose_columns.html', columns=columns, file=file.filename, heatmap='heatmap.png')

@app.route('/train', methods=['POST'])
def train_model():
    filename = request.form['file']
    target = request.form['target']
    features = request.form.getlist('features')

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    df = pd.read_csv(filepath)

    X = df[features]
    y = df[target]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )

    model = RidgeCV(alphas=[0.1, 1.0, 10.0])
    model.fit(X_train, y_train)

    preds = model.predict(X_test)

    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)
    coefs = dict(zip(features, model.coef_))

    plt.figure(figsize=(8, 6))
    sns.scatterplot(x=y_test, y=preds, alpha=0.7)
    plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--')
    plt.xlabel('Фактические значения')
    plt.ylabel('Предсказанные значения')
    plot_path = os.path.join(app.config['STATIC_FOLDER'], 'plot.png')
    plt.tight_layout()
    plt.savefig(plot_path)
    plt.close()

    return render_template(
        'result.html',
        rmse=round(rmse, 2),
        r2=round(r2, 2),
        image=url_for('static', filename='plot.png'),
        coefficients=coefs
    )

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
