all:
	(cd client && npm install && ./build.sh debug)

release:
	(cd client && ./build.sh release)

clean:
	rm -rf client/lib
