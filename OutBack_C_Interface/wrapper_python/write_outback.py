import sys
import InverterFactory

if __name__=='__main__':
    inv = InverterFactory.InverterFactory().factory()
    print(str(inv.write(sys.argv[1], sys.argv[2])))
