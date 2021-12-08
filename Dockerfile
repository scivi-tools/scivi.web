FROM python:3.6

COPY requirements.txt /var/requirements.txt
RUN pip install --no-cache-dir -r /var/requirements.txt

RUN mkdir /app

COPY client /app/client
COPY kb /app/kb
COPY lib /app/lib
COPY onto /app/onto
COPY server /app/server
COPY scivi.py /app/
COPY Makefile /app/
COPY run.sh /app/

RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt install nodejs

RUN make -C /app

WORKDIR /app

ENV PYTHONPATH=/app

CMD sh run.sh
