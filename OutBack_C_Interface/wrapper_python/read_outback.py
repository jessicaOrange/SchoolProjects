import sys
import InverterFactory

if __name__=='__main__':
    inv = InverterFactory.InverterFactory().factory()
    print(str(inv.read(sys.argv[1])))
