all:
	cd client && ./build.sh debug
	cd kb && ./merge.sh

release:
	cd client && ./build.sh release

clean:
	rm -rf client/lib