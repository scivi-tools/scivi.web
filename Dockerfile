FROM python:3.10

COPY requirements.txt /var/requirements.txt
RUN pip install --no-cache-dir -r /var/requirements.txt

RUN mkdir /app

COPY client /app/client
COPY kb /app/kb
COPY lib /app/lib
COPY onto /app/onto
COPY server /app/server
COPY scivi.py /app/

WORKDIR /app

ENV PYTHONPATH=/app

CMD gunicorn -w 1 --bind 0.0.0.0:5000 --timeout 600 --access-logfile - scivi:app
